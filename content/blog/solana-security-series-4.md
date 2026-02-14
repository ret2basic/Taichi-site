---
title: "SPL vs Token2022: From Mint to Account"
slug: "solana-security-series-4"
excerpt: "A technical comparison of SPL Token and Token2022—from mint/account layouts to ATA creation—highlighting program IDs, extensions, and real initialization flows."
author: "jesjupyter (reviewed by ret2basic.eth)"
date: "2026-01-31"
readTime: "15 min read"
category: "Solana"
tags: ["Solana", "Security", "Anchor"]
featured: false
image: "/images/blog/Solana.jpg"
---

This article compares Solana’s two main token standards: the original **SPL Token** program and **Token2022**. It covers program logic, Mint and Token Account layout, and **Associated Token Accounts (ATA)**. SPL Token is the dominant standard today; Token2022 adds extensibility via TLV-based extensions (metadata pointers, transfer hooks, immutable owners, etc.). The rest of the document walks through how each standard structures accounts and handles initialization, and what that means in practice.

## Background

The [Solana token documentation](https://solana.com/docs/tokens) describes two main token programs in the ecosystem.

**Key background terms (quick refresher):**

- **Program ID**: The on-chain address of a program. Tokens are identified by the program that owns their Mint and Token Accounts.
- **Mint**: The account that defines a token’s supply, decimals, and mint/freeze authorities.
- **Token Account**: The account that holds a user’s balance for a specific mint.
- **ATA (Associated Token Account)**: A program-derived address (PDA) token account that is deterministic for a (wallet, mint, token program) tuple.

## SPL

### Token Program

Most tokens are [Solana Program Library (SPL) tokens](https://github.com/solana-program/token/tree/main/program/src).

The program for SPL Token is: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.

### Token Mint

SPL Token Mint is an account owned by the SPL Token Program.

For an SPL token mint, the struct is below, containing:

- `mint_authority`: Optional authority used to mint new tokens.
- `supply`: Total supply of tokens.
- `decimals`: Number of decimals for the token.
- `is_initialized`: Is `true` if this structure has been initialized.
- `freeze_authority`: Optional authority to freeze token accounts.

```rust
/// Mint data.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Mint {
    /// Optional authority used to mint new tokens. The mint authority may only
    /// be provided during mint creation. If no mint authority is present
    /// then the mint has a fixed supply and no further tokens may be
    /// minted.
    pub mint_authority: COption<Pubkey>,
    /// Total supply of tokens.
    pub supply: u64,
    /// Number of base 10 digits to the right of the decimal place.
    pub decimals: u8,
    /// Is `true` if this structure has been initialized
    pub is_initialized: bool,
    /// Optional authority to freeze token accounts.
    pub freeze_authority: COption<Pubkey>,
}
```

For example, in the creation of TRUMP Token (tx: https://solscan.io/tx/3RVpxfaDscntzr4abnmjkkN1cDPthzpxG3Pgt6PksmvhzNDFXxCPPxnKByjPJK4vsmXueD3zxuhYq5PpwCuyigLR):

- The `TRUMP` account (`6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN`) is created and assigned to the **SPL Token Program** as the owner (this is important).
- The `Token Program: InitializeMint2` instruction is executed to initialize the mint.

The input data for the instruction is:
```json
{
  "info": {
    "decimals": 6,
    "freezeAuthority": "5e2qRc1DNEXmyxP8qwPwJhRWjef7usLyi7v5xjqLr5G7",
    "mint": "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    "mintAuthority": "5e2qRc1DNEXmyxP8qwPwJhRWjef7usLyi7v5xjqLr5G7"
  },
  "type": "initializeMint2"
}
```

Let's take a look at how the `InitializeMint2` instruction is processed in the `Token Program`.

```rust
        // 20 - InitializeMint2
        20 => {
            #[cfg(feature = "logging")]
            pinocchio::msg!("Instruction: InitializeMint2");

            process_initialize_mint2(accounts, instruction_data)
        }
```

The `process_initialize_mint2` will finally:
- Validate if the mint is already initialized.
- Validate if the mint is rent-exempt.
- Initialize the mint with the given parameters.
- Pack the mint data back to the account.

```rust
/// Program state handler.
pub struct Processor {}
impl Processor {
    fn _process_initialize_mint(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: COption<Pubkey>,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        let mint_data_len = mint_info.data_len();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        let mut mint = Mint::unpack_unchecked(&mint_info.data.borrow())?;
        if mint.is_initialized {
            return Err(TokenError::AlreadyInUse.into());
        }

        if !rent.is_exempt(mint_info.lamports(), mint_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        mint.mint_authority = COption::Some(mint_authority);
        mint.decimals = decimals;
        mint.is_initialized = true;
        mint.freeze_authority = freeze_authority;

        Mint::pack(mint, &mut mint_info.data.borrow_mut())?;

        Ok(())
    }
```

### Token Account

After we have the mint, we should create a token account to hold the tokens.

For the related `TokenAccount` struct, it is below:

```rust
/// Account data.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Account {
    /// The mint associated with this account
    pub mint: Pubkey,
    /// The owner of this account.
    pub owner: Pubkey,
    /// The amount of tokens this account holds.
    pub amount: u64,
    /// If `delegate` is `Some` then `delegated_amount` represents
    /// the amount authorized by the delegate
    pub delegate: COption<Pubkey>,
    /// The account's state
    pub state: AccountState,
    /// If `is_native.is_some`, this is a native token, and the value logs the
    /// rent-exempt reserve. An Account is required to be rent-exempt, so
    /// the value is used by the Processor to ensure that wrapped SOL
    /// accounts do not drop below this threshold.
    pub is_native: COption<u64>,
    /// The amount delegated
    pub delegated_amount: u64,
    /// Optional authority to close the account.
    pub close_authority: COption<Pubkey>,
}
```

It should be noted that the whole `Account` struct is 165 bytes, which is the standard size of a Solana Token Account.

**How 165 is calculated**

The struct uses `#[repr(C)]`, so layout is predictable. SPL uses `COption<T>` for optional fields: a **4-byte tag** (0 = None, 1 = Some) plus the inner type when present. So `COption<Pubkey>` = 4 + 32 = 36 bytes, and `COption<u64>` = 4 + 8 = 12 bytes. `AccountState` is a 1-byte enum.

| Field             | Type             | Size (bytes) |
|-------------------|------------------|--------------|
| mint              | Pubkey           | 32           |
| owner             | Pubkey           | 32           |
| amount            | u64              | 8            |
| delegate          | COption\<Pubkey\> | 4 + 32 = 36  |
| state             | AccountState     | 1            |
| is_native         | COption\<u64\>   | 4 + 8 = 12   |
| delegated_amount  | u64              | 8            |
| close_authority   | COption\<Pubkey\> | 4 + 32 = 36  |
| **Total**         |                  | **165**      |

If we want to create a token account for the `TRUMP` token, we need to create a new account and assign it to the **SPL Token Program** as the owner, then use the `InitializeAccount3` instruction to initialize the account.

`process_initialize_account3` will do:
- Validate if the account is already initialized.
- Validate if the account is rent-exempt.
- Special handling for native mint.
- Initialize the account with the given parameters.
- Pack the account data back to the account.

```rust
    fn _process_initialize_account(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        owner: Option<&Pubkey>,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let new_account_info = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let owner = if let Some(owner) = owner {
            owner
        } else {
            next_account_info(account_info_iter)?.key
        };
        let new_account_info_data_len = new_account_info.data_len();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        let mut account = Account::unpack_unchecked(&new_account_info.data.borrow())?;
        if account.is_initialized() {
            return Err(TokenError::AlreadyInUse.into());
        }

        if !rent.is_exempt(new_account_info.lamports(), new_account_info_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        let is_native_mint = Self::cmp_pubkeys(mint_info.key, &crate::native_mint::id());
        if !is_native_mint {
            Self::check_account_owner(program_id, mint_info)?;
            let _ = Mint::unpack(&mint_info.data.borrow_mut())
                .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        }

        account.mint = *mint_info.key;
        account.owner = *owner;
        account.close_authority = COption::None;
        account.delegate = COption::None;
        account.delegated_amount = 0;
        account.state = AccountState::Initialized;
        if is_native_mint {
            let rent_exempt_reserve = rent.minimum_balance(new_account_info_data_len);
            account.is_native = COption::Some(rent_exempt_reserve);
            account.amount = new_account_info
                .lamports()
                .checked_sub(rent_exempt_reserve)
                .ok_or(TokenError::Overflow)?;
        } else {
            account.is_native = COption::None;
            account.amount = 0;
        };

        Account::pack(account, &mut new_account_info.data.borrow_mut())?;

        Ok(())
    }
```


## Token2022

### Token Program
[Token2022](https://github.com/solana-program/token-2022) is a newer token standard with additional features. It builds on the SPL token program, so account layouts are similar, but it stores extensions in a TLV (type-length-value) region after the base account data.

The program for Token2022 is: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`.

### Token Mint

Let's take 2022 token `Tesla xStock` for example: https://solscan.io/tx/5yKhATi8myn5XLPcKNkzvaTWSLhFR3CD1sEDsLvYib7BQTWzjjKqeQo2VP5uiDGaLt6kUkQAxi11r835uHCu42Z8

- The `Tesla xStock` account (`XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB`) is created and assigned to the **Token2022 Program** as the owner (this is important).

- The `initializeMetadataPointer`, `initializeTransferHook` and many other initializations are performed.

For example, for `InitializeMetadataPointer`, the input data is:
```rust
                PodTokenInstruction::MetadataPointerExtension => {
                    metadata_pointer::processor::process_instruction(
                        program_id,
                        accounts,
                        &input[1..],
                    )
                }
```

which dispatches to `process_initialize`

```rust
        MetadataPointerInstruction::Initialize => {
            msg!("MetadataPointerInstruction::Initialize");
            let InitializeInstructionData {
                authority,
                metadata_address,
            } = decode_instruction_data(input)?;
            process_initialize(program_id, accounts, authority, metadata_address)
        }
```

This invokes `process_initialize` in the metadata pointer module:

```rust
fn process_initialize(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    authority: &OptionalNonZeroPubkey,
    metadata_address: &OptionalNonZeroPubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let mint_account_info = next_account_info(account_info_iter)?;
    let mut mint_data = mint_account_info.data.borrow_mut();
    let mut mint = PodStateWithExtensionsMut::<PodMint>::unpack_uninitialized(&mut mint_data)?;

    let extension = mint.init_extension::<MetadataPointer>(true)?;
    extension.authority = *authority;

    if Option::<Pubkey>::from(*authority).is_none()
        && Option::<Pubkey>::from(*metadata_address).is_none()
    {
        msg!("The metadata pointer extension requires at least an authority or an address for initialization, neither was provided");
        Err(TokenError::InvalidInstruction)?;
    }
    extension.metadata_address = *metadata_address;
    Ok(())
}
```

`unpack_uninitialized` verifies the base is not initialized yet and splits the account data into two regions: fixed-size `base_data` and variable-size `tlv_data` (where extensions live).

```
| Base State (fixed size S) | TLV extensions (variable) |
```

```rust
    /// Unpack an uninitialized base state, leaving the extension data as a
    /// mutable slice
    ///
    /// Fails if the base state has already been initialized.
    pub fn unpack_uninitialized(input: &'data mut [u8]) -> Result<Self, ProgramError> {
        check_min_len_and_not_multisig(input, S::SIZE_OF)?;
        let (base_data, rest) = input.split_at_mut(S::SIZE_OF);
        let base = pod_from_bytes_mut::<S>(base_data)?;
        if base.is_initialized() {
            return Err(TokenError::AlreadyInUse.into());
        }
        let (account_type, tlv_data) = unpack_uninitialized_type_and_tlv_data_mut::<S>(rest)?;
        let state = Self {
            base,
            account_type,
            tlv_data,
        };
        state.check_account_type_matches_extension_type()?;
        Ok(state)
    }
```

Later, the `init_extension` will be called to initialize the extension.

```rust
    /// Packs the default extension data into an open slot if not already found
    /// in the data buffer. If extension is already found in the buffer, it
    /// overwrites the existing extension with the default state if
    /// `overwrite` is set. If extension found, but `overwrite` is not set,
    /// it returns error.
    fn init_extension<V: Extension + Pod + Default>(
        &mut self,
        overwrite: bool,
    ) -> Result<&mut V, ProgramError> {
        let length = pod_get_packed_len::<V>();
        let buffer = self.alloc::<V>(length, overwrite)?;
        let extension_ref = pod_from_bytes_mut::<V>(buffer)?;
        *extension_ref = V::default();
        Ok(extension_ref)
    }
```

Note: **`self.alloc` allocates space for the extension (accounting for any already-initialized extensions, so a mint can have multiple extensions), and `pod_from_bytes_mut` gives a typed view into that buffer.**

So the `TLV extensions (variable)` could contain multiple extensions.

```plaintext
| Extension 1 | Extension 2 | Extension 3 | ... |
```

The `*extension_ref = V::default();` will set the extension to the default state which would later be altered to the intended state.

```rust
    extension.authority = *authority;

    if Option::<Pubkey>::from(*authority).is_none()
        && Option::<Pubkey>::from(*metadata_address).is_none()
    {
        msg!("The metadata pointer extension requires at least an authority or an address for initialization, neither was provided");
        Err(TokenError::InvalidInstruction)?;
    }
    extension.metadata_address = *metadata_address;
```

Finally, the `InitializeMint` instruction is called to initialize the base mint data.

```rust
    /// Processes an [`InitializeMint`](enum.TokenInstruction.html) instruction.
    pub fn process_initialize_mint(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: &Pubkey,
        freeze_authority: PodCOption<Pubkey>,
    ) -> ProgramResult {
        Self::_process_initialize_mint(accounts, decimals, mint_authority, freeze_authority, true)
    }
```

`_process_initialize_mint` is largely the same as in SPL; the main difference is validation and initialization of extensions and account type.

```rust
    fn _process_initialize_mint(
        accounts: &[AccountInfo],
        decimals: u8,
        mint_authority: &Pubkey,
        freeze_authority: PodCOption<Pubkey>,
        rent_sysvar_account: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_info = next_account_info(account_info_iter)?;
        let mint_data_len = mint_info.data_len();
        let mut mint_data = mint_info.data.borrow_mut();
        let rent = if rent_sysvar_account {
            Rent::from_account_info(next_account_info(account_info_iter)?)?
        } else {
            Rent::get()?
        };

        if !rent.is_exempt(mint_info.lamports(), mint_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        let mut mint = PodStateWithExtensionsMut::<PodMint>::unpack_uninitialized(&mut mint_data)?;
        let extension_types = mint.get_extension_types()?;
        if ExtensionType::try_calculate_account_len::<Mint>(&extension_types)? != mint_data_len {
            return Err(ProgramError::InvalidAccountData);
        }
        ExtensionType::check_for_invalid_mint_extension_combinations(&extension_types)?;

        if let Ok(default_account_state) = mint.get_extension_mut::<DefaultAccountState>() {
            let default_account_state = AccountState::try_from(default_account_state.state)
                .or(Err(ProgramError::InvalidAccountData))?;
            if default_account_state == AccountState::Frozen && freeze_authority.is_none() {
                return Err(TokenError::MintCannotFreeze.into());
            }
        }

        mint.base.mint_authority = PodCOption::some(*mint_authority);
        mint.base.decimals = decimals;
        mint.base.is_initialized = PodBool::from_bool(true);
        mint.base.freeze_authority = freeze_authority;
        mint.init_account_type()?;

        Ok(())
    }
```

### Token Account

Similar to Token Mint, a Token2022 Token Account is also divided into two parts: `base_data` and `tlv_data`.

The `InitializeAccount3` instruction initializes the account:
- Validate if the account is already initialized.
- Validate if the account is rent-exempt.
- Validate if the mint is valid.
- Check the mint's extensions and initialize the required account extensions.
- Initialize base data of the account.

```rust

        let mut account_data = new_account_info.data.borrow_mut();
        // unpack_uninitialized checks account.base.is_initialized() under the hood
        let mut account =
            PodStateWithExtensionsMut::<PodAccount>::unpack_uninitialized(&mut account_data)?;

        if !rent.is_exempt(new_account_info.lamports(), new_account_info_data_len) {
            return Err(TokenError::NotRentExempt.into());
        }

        // get_required_account_extensions checks mint validity
        let mint_data = mint_info.data.borrow();
        let mint = PodStateWithExtensions::<PodMint>::unpack(&mint_data)
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        if mint
            .get_extension::<PermanentDelegate>()
            .map(|e| Option::<Pubkey>::from(e.delegate).is_some())
            .unwrap_or(false)
        {
            msg!("Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time");
        }
        let required_extensions =
            Self::get_required_account_extensions_from_unpacked_mint(mint_info.owner, &mint)?;
        if ExtensionType::try_calculate_account_len::<Account>(&required_extensions)?
            > new_account_info_data_len
        {
            return Err(ProgramError::InvalidAccountData);
        }
        for extension in required_extensions {
            account.init_account_extension_from_type(extension)?;
        }

        let starting_state =
            if let Ok(default_account_state) = mint.get_extension::<DefaultAccountState>() {
                AccountState::try_from(default_account_state.state)
                    .or(Err(ProgramError::InvalidAccountData))?
            } else {
                AccountState::Initialized
            };

        account.base.mint = *mint_info.key;
        account.base.owner = *owner;
        account.base.close_authority = PodCOption::none();
        account.base.delegate = PodCOption::none();
        account.base.delegated_amount = 0.into();
        account.base.state = starting_state.into();
        if mint_info.key == &native_mint::id() {
            let rent_exempt_reserve = rent.minimum_balance(new_account_info_data_len);
            account.base.is_native = PodCOption::some(rent_exempt_reserve.into());
            account.base.amount = new_account_info
                .lamports()
                .checked_sub(rent_exempt_reserve)
                .ok_or(TokenError::Overflow)?
                .into();
        } else {
            account.base.is_native = PodCOption::none();
            account.base.amount = 0.into();
        };

        account.init_account_type()?;

        Ok(())
    }

```

## Associated Token Account (ATA)

Creating a token account directly via `InitializeAccount3` requires manually creating and assigning a new account, and deriving the token account address from mint and owner is non-trivial. The **Associated Token Account (ATA)** program simplifies this.

Example transactions:
- **SPL**: [solscan.io/tx/4kyR...](https://solscan.io/tx/4kyRXRAMy6HHRnFqPDSo69UmUR9i6q8Hpbro9AHe9zciWn5UbRmyaGysDMuqELPVJpMg5UgkX3vpqyDxbzLvcMdZ)
- **Token2022**: [solscan.io/tx/DfNte...](https://solscan.io/tx/DfNteAHtzxAhxZ4KyKNcu5BeQ6cqXUwhNMhUhxuAZdhbGL46Z5swP2YAtpco7Ruw7pkfs4otiwHbGXoKNpHxpKZ)

The overall workflow is the same:

- Associated Token Program: Create
    - Token Program: GetAccountDataSize
    - System Program: CreateAccount
    - Token Program: InitializeImmutableOwner
    - Token Program: InitializeAccount3

```rust
    match instruction {
        AssociatedTokenAccountInstruction::Create => {
            process_create_associated_token_account(program_id, accounts, CreateMode::Always)
        }
        AssociatedTokenAccountInstruction::CreateIdempotent => {
            process_create_associated_token_account(program_id, accounts, CreateMode::Idempotent)
        }
        AssociatedTokenAccountInstruction::RecoverNested => {
            process_recover_nested(program_id, accounts)
        }
    }
```

In the `process_create_associated_token_account`, the following steps will be taken.

### Get Account Data Size

The ATA explicitly uses the `ImmutableOwner` extension, so the `extension_types` is `&[ExtensionType::ImmutableOwner]`.

```rust
    let account_len = get_account_len(
        spl_token_mint_info,
        spl_token_program_info,
        &[ExtensionType::ImmutableOwner],
    )?;
```
```rust
/// Determines the required initial data length for a new token account based on
/// the extensions initialized on the Mint
pub fn get_account_len<'a>(
    mint: &AccountInfo<'a>,
    spl_token_program: &AccountInfo<'a>,
    extension_types: &[ExtensionType],
) -> Result<usize, ProgramError> {
    invoke(
        &spl_token_2022_interface::instruction::get_account_data_size(
            spl_token_program.key,
            mint.key,
            extension_types,
        )?,
        &[mint.clone(), spl_token_program.clone()],
    )?;
    get_return_data()
        .ok_or(ProgramError::InvalidInstructionData)
        .and_then(|(key, data)| {
            if key != *spl_token_program.key {
                return Err(ProgramError::IncorrectProgramId);
            }
            data.try_into()
                .map(usize::from_le_bytes)
                .map_err(|_| ProgramError::InvalidInstructionData)
        })
}
```

- **SPL**: Account data size is 165 bytes.

This returns 165 bytes for SPL. The SPL Token program accepts the instruction but ignores extensions because SPL accounts do not support TLV extensions.

```rust
    /// Processes a [`GetAccountDataSize`](enum.TokenInstruction.html)
    /// instruction
    pub fn process_get_account_data_size(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // make sure the mint is valid
        let mint_info = next_account_info(account_info_iter)?;
        Self::check_account_owner(program_id, mint_info)?;
        let _ = Mint::unpack(&mint_info.data.borrow())
            .map_err(|_| Into::<ProgramError>::into(TokenError::InvalidMint))?;
        set_return_data(&Account::LEN.to_le_bytes());
        Ok(())
    }
```

```plaintext
  > Program log: Instruction: GetAccountDataSize
  > Program consumed: 1569 of 392458 compute units
  > Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA= // pQAAAAAAAAA= is the base64 encoded account data size
  > Program returned success
```

Use command `echo pQAAAAAAAAA= | base64 --decode | xxd` to decode the base64 encoded account data size.
```plaintext
echo pQAAAAAAAAA= | base64 --decode | xxd
00000000: a500 0000 0000 0000    // 0xa5 (decimal 165) = account data size in bytes
```

- **Token2022**: Returns 165 bytes plus the `ImmutableOwner` extension size (14 bytes), i.e. 179 bytes total.

```rust
                PodTokenInstruction::GetAccountDataSize => {
                    msg!("Instruction: GetAccountDataSize");
                    let extension_types = input[1..]
                        .chunks(std::mem::size_of::<ExtensionType>())
                        .map(ExtensionType::try_from)
                        .collect::<Result<Vec<_>, _>>()?;
                    Self::process_get_account_data_size(accounts, &extension_types)
                }
```

In real tx, it returns:

```plaintext
> Invoking
Token 2022 Program
  > Program log: Instruction: GetAccountDataSize
  > Program consumed: 2056 of 1394611 compute units
  > Program return: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb swAAAAAAAAA=
  > Program returned success
```

```plaintext
echo swAAAAAAAAA= | base64 --decode | xxd

00000000: b300 0000 0000 0000  // 0xb3 (decimal 179) = base account (165) + ImmutableOwner (14)
```

### Create PDA and assign it to the Token Program (SPL / Token2022)

`create_pda_account` creates a PDA and assigns it to the SPL Token or Token2022 program.

```rust
    create_pda_account(
        funder_info,
        &rent,
        account_len,
        spl_token_program_id, // <= will be the owner of the PDA account
        system_program_info,
        associated_token_account_info,
        associated_token_account_signer_seeds,
    )?;
```
Inside `create_pda_account`, the PDA is assigned to `spl_token_program_id` as its owner.
```rust
/// Creates associated token account using Program Derived Address for the given
/// seeds
pub fn create_pda_account<'a>(
    payer: &AccountInfo<'a>,
    rent: &Rent,
    space: usize,
    owner: &Pubkey,
    system_program: &AccountInfo<'a>,
    new_pda_account: &AccountInfo<'a>,
    new_pda_signer_seeds: &[&[u8]],
) -> ProgramResult {
        // ... other checks ...
        invoke_signed(
            &system_instruction::allocate(new_pda_account.key, space as u64),
            &[new_pda_account.clone(), system_program.clone()],
            &[new_pda_signer_seeds],
        )?;

        invoke_signed(
            &system_instruction::assign(new_pda_account.key, owner),
            &[new_pda_account.clone(), system_program.clone()],
            &[new_pda_signer_seeds],
        )
```

### Call Token Program (SPL/Token2022) to Initialize the PDA Account

```rust
    msg!("Initialize the associated token account");
    invoke(
        &spl_token_2022_interface::instruction::initialize_immutable_owner(
            spl_token_program_id,
            associated_token_account_info.key,
        )?,
        &[
            associated_token_account_info.clone(),
            spl_token_program_info.clone(),
        ],
    )?;
```

This will call `process_initialize_immutable_owner` in the program.

- **SPL**: The instruction is a no-op; it only checks that the account is not already initialized.
```rust
    /// Processes an [`InitializeImmutableOwner`](enum.TokenInstruction.html)
    /// instruction
    pub fn process_initialize_immutable_owner(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let token_account_info = next_account_info(account_info_iter)?;
        let account = Account::unpack_unchecked(&token_account_info.data.borrow())?;
        if account.is_initialized() {
            return Err(TokenError::AlreadyInUse.into());
        }
        msg!("Please upgrade to SPL Token 2022 for immutable owner support");
        Ok(())
    }
```

- **Token2022**: `process_initialize_immutable_owner` initializes the `ImmutableOwner` extension.
```rust
    /// Processes an [`InitializeImmutableOwner`](enum.TokenInstruction.html)
    /// instruction
    pub fn process_initialize_immutable_owner(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let token_account_info = next_account_info(account_info_iter)?;
        let token_account_data = &mut token_account_info.data.borrow_mut();
        let mut token_account =
            PodStateWithExtensionsMut::<PodAccount>::unpack_uninitialized(token_account_data)?;
        token_account
            .init_extension::<ImmutableOwner>(true)
            .map(|_| ())
    }
```

### Call `InitializeAccount3` to Initialize the PDA Account

```rust
    invoke(
        &spl_token_2022_interface::instruction::initialize_account3(
            spl_token_program_id,
            associated_token_account_info.key,
            spl_token_mint_info.key,
            wallet_account_info.key,
        )?,
        &[
            associated_token_account_info.clone(),
            spl_token_mint_info.clone(),
            wallet_account_info.clone(),
            spl_token_program_info.clone(),
        ],
    )
```

This invokes `process_initialize_account3`, whose implementation was described in the previous section for both SPL and Token2022.

### Why use Associated Token Accounts?

ATA uses a **PDA** derived from the wallet, mint, and token program, so the relationship between token account, mint, and owner is deterministic and reproducible. The Associated Token Program also encapsulates account creation, rent, and token initialization, so callers can create ATAs with a single instruction instead of reimplementing the flow.

---

## Key Takeaways

| Aspect | SPL Token | Token2022 |
|--------|-----------|-----------|
| **Program ID** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Mint / Account layout** | Fixed struct (Mint 82 bytes, Account 165 bytes) | Base layout + TLV extensions (variable) |
| **Extensions** | None | Metadata pointer, transfer hook, ImmutableOwner, etc. |
| **ATA flow** | Create PDA → InitializeImmutableOwner (no-op) → InitializeAccount3 | Same, but InitializeImmutableOwner sets extension; GetAccountDataSize returns 179 (165 + 14) for ATA |
| **Use ATA when** | You want a deterministic token account per (wallet, mint, program) | Same; ATA program works for both SPL and Token2022 |

When auditing or integrating tokens, always check the **program ID** to distinguish SPL from Token2022, and for Token2022 read the mint’s extensions to know required account size and behavior (e.g., transfer hooks, immutable owner).

---

## Additional Notes (for reviewers)

- The SPL `InitializeAccount3` and `InitializeMint2` instructions are shown using their on-chain processor names for clarity, but the on-chain program dispatches by instruction variant (e.g., “Instruction: InitializeMint2”).
- The ATA program works with both token programs; it simply routes to the token program you pass in and uses `GetAccountDataSize` to compute the correct size.
