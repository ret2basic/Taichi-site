---
title: "Pre-Funding DoS in Solana: Breaking create_account with Non-Zero Lamports"
slug: "solana-security-series-1"
excerpt: "A system-level Solana DoS pattern: pre-funding a predictable address (e.g., a PDA) makes `create_account` fail with AccountAlreadyInUse. Includes mitigations and how Anchor avoids it."
author: "jesjupyter (reviewed by ret2basic.eth)"
date: "2025-12-29"
readTime: "10 min read"
category: "Solana"
tags: ["Solana", "Security", "Anchor"]
featured: false
image: "/images/blog/Solana.jpg"
---

This post covers a **system-level DoS** vector on Solana: if your program initializes an account via the System Program’s `create_account`, a third party may be able to **pre-fund** the destination address and cause the initialization to fail permanently.

## TL;DR

- `create_account` rejects the destination if it already has **non-zero lamports** (`AccountAlreadyInUse`).
- Attackers can often **precompute** addresses you will initialize (especially PDAs) and **pre-fund them with the minimum lamports to keep the account rent-exempt**, making the DoS persistent.
- Fix: don’t rely on `create_account` when the destination might be pre-funded; use the safer `transfer` + `allocate` + `assign` flow (or let Anchor handle it).

## Account Creation

In Solana, account creation is commonly performed by invoking the **System Program’s** `create_account` instruction from within a program.

This pattern shows up most often when initializing **program-derived addresses (PDAs)** with `invoke_signed`.

Below is a simplified example:

```rust
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let new_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Typical vulnerable pattern: initializing a PDA using create_account.
    // If `new_account` was pre-funded (lamports > 0), this will fail with AccountAlreadyInUse.
    let space: u64 = 8 + 8;
    let lamports: u64 = Rent::get()?.minimum_balance(space as usize);
    let seeds: &[&[u8]] = &[b"data", payer.key.as_ref() /*, bump */];

    invoke_signed(
        &solana_program::system_instruction::create_account(
            payer.key,
            new_account.key,
            lamports,
            space,
            program_id,
        ),
        &[payer.clone(), new_account.clone(), system_program.clone()],
        &[seeds],
    )?;

    msg!("Account created successfully.");
    Ok(())
}
```

This code assumes that new_account **has never been created before**.

## How is it DoSed

At first glance, calling create_account appears safe. However, to understand the risk, we need to look at how the instruction behaves internally.

### Why pre-funding is possible

On Solana, it’s possible to transfer lamports to an address even if it has never been explicitly “created” by your program. In practice, the attacker can include the target pubkey as a writable account meta and execute a System Program transfer. The result is a (system-owned) account with:

- `lamports > 0`
- `data_len == 0`
- `owner == System Program`

That’s enough to trip the `create_account` guard.

According to the documentation in
[system_instruction.rs](https://github.com/solana-labs/solana/blob/7700cb3128c1f19820de67b81aa45d18f73d2ac0/sdk/program/src/system_instruction.rs#L11-L13):

```rust

//! Account creation typically involves three steps: [`allocate`] space,
//! [`transfer`] lamports for rent, [`assign`] to its owning program. The
//! [`create_account`] function does all three at once. All new accounts must
//! contain enough lamports to be [rent exempt], or else the creation
//! instruction will fail.
```

Conceptually, `create_account` is a convenience wrapper around:

1. `allocate`
2. `transfer`
3. `assign`

### Runtime Behavior

The actual runtime logic lives in [system_processor.rs](https://github.com/solana-labs/solana/blob/master/programs/system/src/system_processor.rs)

```rust
#[allow(clippy::too_many_arguments)]
fn create_account(
    from_account_index: IndexOfAccount,
    to_account_index: IndexOfAccount,
    to_address: &Address,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
    signers: &HashSet<Pubkey>,
    invoke_context: &InvokeContext,
    transaction_context: &TransactionContext,
    instruction_context: &InstructionContext,
) -> Result<(), InstructionError> {
    // if it looks like the `to` account is already in use, bail
    {
        let mut to = instruction_context
            .try_borrow_instruction_account(transaction_context, to_account_index)?;
        if to.get_lamports() > 0 {
            ic_msg!(
                invoke_context,
                "Create Account: account {:?} already in use",
                to_address
            );
            return Err(SystemError::AccountAlreadyInUse.into());
        }

        allocate_and_assign(&mut to, to_address, space, owner, signers, invoke_context)?;
    }
    transfer(
        from_account_index,
        to_account_index,
        lamports,
        invoke_context,
        transaction_context,
        instruction_context,
    )
}
```

The key observation is the following check:

```rust
        if to.get_lamports() > 0 {
            ic_msg!(
                invoke_context,
                "Create Account: account {:?} already in use",
                to_address
            );
            return Err(SystemError::AccountAlreadyInUse.into());
        }
```

**Any account with a non-zero lamport balance is considered “already in use.”**

Note: although the docs describe “allocate → transfer → assign” conceptually, the runtime implementation performs the “already in use” check first, then `allocate_and_assign`, and finally `transfer`. The DoS is specifically about that early `lamports > 0` guard.

### Pre-funding DoS Vector

If the destination account address can be **precomputed** (for example, a PDA derived from predictable seeds), an attacker can:

1. Precompute the target address
2. Transfer the minimum lamports needed to keep it **rent-exempt** (commonly the minimum balance for a system-owned, 0-data account)
3. Cause `create_account` to revert with `AccountAlreadyInUse`, blocking the entire logic.

This results in a **persistent DoS**, as subsequent attempts to initialize the account will fail. While brute-forcing arbitrary addresses is impractical, this attack becomes realistic when PDA seeds are simple or predictable (e.g., `user_pubkey`, `mint`, or `static identifiers`).

## When are you vulnerable?

You’re in the danger zone if all of these are true:

1. Your program (or client) derives a destination address that an attacker can predict (commonly a PDA).
2. Your initialization path uses System Program `create_account`.
3. You don’t have a fallback path when `lamports > 0`.

## Mitigations

There are two commonly used mitigation strategies:

1. **Drain pre-funded lamports**
    - If you can sign for the address (e.g., it’s your PDA, so you can `invoke_signed`), you can transfer the lamports out first so the balance is zero, then proceed.
    - This is not always available (e.g., if the destination is not a PDA you control).
2. **Avoid create_account entirely**
    - Manually split the process into:
        - `transfer`
        - `allocate`
        - `assign`
    - This avoids the `AccountAlreadyInUse` check.

### Practical mitigation pattern (manual)

If you control the destination (most commonly because it’s a PDA), you can branch on the current lamports and safely recover even when the address is pre-funded.

The key is: **`allocate` and `assign` are allowed on a system-owned, zero-data account**, but they require the account itself to sign (so for PDAs you must use `invoke_signed`).

```rust
let current_lamports = new_account.lamports();

if current_lamports == 0 {
    // Safe to use create_account
    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            new_account.key,
            rent.minimum_balance(space as usize),
            space,
            program_id,
        ),
        &[payer.clone(), new_account.clone(), system_program.clone()],
        &[seeds],
    )?;
} else {
    // 1) top up to rent-exempt if needed
    let required = rent
        .minimum_balance(space as usize)
        .saturating_sub(current_lamports);
    if required > 0 {
        invoke(
            &system_instruction::transfer(payer.key, new_account.key, required),
            &[payer.clone(), new_account.clone(), system_program.clone()],
        )?;
    }

    // 2) allocate space (requires signature)
    invoke_signed(
        &system_instruction::allocate(new_account.key, space),
        &[new_account.clone(), system_program.clone()],
        &[seeds],
    )?;

    // 3) assign owner (requires signature)
    invoke_signed(
        &system_instruction::assign(new_account.key, program_id),
        &[new_account.clone(), system_program.clone()],
        &[seeds],
    )?;
}
```

### How Anchor Handles It

Anchor’s `#[account(init)]` and `#[account(init_if_needed)]` constraints explicitly address this issue by generating code that:

1. Checks `field.lamports()` at runtime
2. Uses `create_account` only when `lamports == 0`
3. Otherwise falls back to the safer `transfer` + `allocate` + `assign` flow

Example user code:

```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init, 
        payer = signer, 
        space = 8 + 8
    )]
    pub new_account: Account<'info, DataAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DataAccount {
    data: u64,
}
```

In [generate_constraint_init_group](https://github.com/solana-foundation/anchor/blob/347c0599b8310d84af4086cfe5c975733a9e17cd/lang/syn/src/codegen/accounts/constraints.rs#L1067-L1108), the owner is checked and the `generate_create_account` is being called.

```rust

            // Define the owner of the account being created. If not specified,
            // default to the currently executing program.
            let (owner, owner_optional_check) = match owner {
                None => (
                    quote! {
                        __program_id
                    },
                    quote! {},
                ),

                Some(o) => {
                    // We clone the `check_scope` here to avoid collisions with the
                    // `payer_optional_check`, which is in a separate scope
                    let owner_optional_check = check_scope.clone().generate_check(o);
                    (
                        quote! {
                            &#o
                        },
                        owner_optional_check,
                    )
                }
            };
```

```rust
            // CPI to the system program to create the account.
            let create_account = generate_create_account(
                field,
                quote! {space},
                owner.clone(),
                quote! {#payer},
                seeds_with_bump,
            );
```

Internally, [anchor-generated code](https://github.com/solana-foundation/anchor/blob/347c0599b8310d84af4086cfe5c975733a9e17cd/lang/syn/src/codegen/accounts/constraints.rs#L1675-L1728) checks whether the account already holds lamports. If so, it **avoids create_account** and falls back to a safer flow.

```rust
fn generate_create_account(
    field: &Ident,
    space: proc_macro2::TokenStream,
    owner: proc_macro2::TokenStream,
    payer: proc_macro2::TokenStream,
    seeds_with_nonce: proc_macro2::TokenStream,
) -> proc_macro2::TokenStream {
    // Field, payer, and system program are already validated to not be an Option at this point
    quote! {
        // If the account being initialized already has lamports, then
        // return them all back to the payer so that the account has
        // zero lamports when the system program's create instruction
        // is eventually called.
        let __current_lamports = #field.lamports();
        if __current_lamports == 0 {
            // Create the token account with right amount of lamports and space, and the correct owner.
            let space = #space;
            let lamports = __anchor_rent.minimum_balance(space);
            let cpi_accounts = anchor_lang::system_program::CreateAccount {
                from: #payer.to_account_info(),
                to: #field.to_account_info()
            };
            let cpi_context = anchor_lang::context::CpiContext::new(system_program.key(), cpi_accounts);
            anchor_lang::system_program::create_account(cpi_context.with_signer(&[#seeds_with_nonce]), lamports, space as u64, #owner)?;
        } else {
            require_keys_neq!(#payer.key(), #field.key(), anchor_lang::error::ErrorCode::TryingToInitPayerAsProgramAccount);
            // Fund the account for rent exemption.
            let required_lamports = __anchor_rent
                .minimum_balance(#space)
                .max(1)
                .saturating_sub(__current_lamports);
            if required_lamports > 0 {
                let cpi_accounts = anchor_lang::system_program::Transfer {
                    from: #payer.to_account_info(),
                    to: #field.to_account_info(),
                };
                let cpi_context = anchor_lang::context::CpiContext::new(system_program.key(), cpi_accounts);
                anchor_lang::system_program::transfer(cpi_context, required_lamports)?;
            }
            // Allocate space.
            let cpi_accounts = anchor_lang::system_program::Allocate {
                account_to_allocate: #field.to_account_info()
            };
            let cpi_context = anchor_lang::context::CpiContext::new(system_program.key(), cpi_accounts);
            anchor_lang::system_program::allocate(cpi_context.with_signer(&[#seeds_with_nonce]), #space as u64)?;
            // Assign to the spl token program.
            let cpi_accounts = anchor_lang::system_program::Assign {
                account_to_assign: #field.to_account_info()
            };
            let cpi_context = anchor_lang::context::CpiContext::new(system_program.key(), cpi_accounts);
            anchor_lang::system_program::assign(cpi_context.with_signer(&[#seeds_with_nonce]), #owner)?;
        }
    }
}
```

Important clarifications when reading this generated code:

- The comment “return them all back to the payer … so that the account has zero lamports” is misleading in this excerpt: the mitigation here is primarily **avoiding `create_account`** when `__current_lamports > 0`.
- The comment “Assign to the spl token program” is also misleading: the generated code assigns the account to `#owner` (the owner passed into the constraint), which is not necessarily the SPL Token program.
- `with_signer(&[#seeds_with_nonce])` is what makes this work for PDAs: it supplies the PDA signature required by `allocate` and `assign`.

Key logic (simplified):

```rust
let current_lamports = field.lamports();
if current_lamports == 0 {
    // create_account
} else {
    // transfer (rent top-up)
    // allocate
    // assign (to the intended program owner)
}
```

By doing so, Anchor effectively mitigates the pre-funding DoS vector.

# References

- https://github.com/solana-labs/solana/blob/master/programs/system/src/system_processor.rs
- https://github.com/solana-foundation/anchor/blob/347c0599b8310d84af4086cfe5c975733a9e17cd/lang/syn/src/codegen/accounts/constraints.rs#L1675-L1728
