---
title: "Why Anchor Accounts Go Stale After CPI (and When to Reload)"
slug: "solana-security-series-3"
excerpt: "In Anchor, `Account<T>` is a cached snapshot of account data. After CPI, the runtime account changes but your cached view does not—unless you `reload()`."
author: "jesjupyter (reviewed by ret2basic.eth)"
date: "2026-01-09"
readTime: "10 min read"
category: "Solana"
tags: ["Solana", "Security", "Anchor"]
featured: false
image: "/images/blog/Solana.jpg"
---

Anchor code reviews often include the advice: "After CPI, reload the account." This post explains the *why*.

TL;DR:

- In **native Solana**, you usually work directly with `AccountInfo` (a handle to the account's in-memory runtime state).
- In **Anchor**, `Account<'info, T>` contains both an `AccountInfo` *and* a deserialized `T` (a cached snapshot).
- CPI updates the runtime state, but it does **not** automatically update your cached `T`. `reload()` refreshes the cache.

## Prerequisites

This article assumes you have seen the following concepts before:

- **CPI** (cross-program invocation): calling another program via `invoke`/`invoke_signed`.
- **Accounts as a working set**: during instruction execution, accounts live in the runtime and are mutated in-memory.
- **(De)serialization**: account *data* is bytes; reading structured fields requires deserializing those bytes.

If you know Anchor's `Context` + basic CPI patterns, you're good.

## Examples

Consider a common Anchor pattern: transferring tokens via CPI, then checking a token account's `amount`.

`TokenAccount.amount` lives in the account's **data** (not in lamports).

```rust
    // `vault` is an `Account<TokenAccount>` (a deserialized view).
    // Read before CPI.
    let vault_before = vault.amount;

    // CPI: SPL Token transfer
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::Transfer {
            from: user.to_account_info(),
            to: vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    // Read after CPI.
    let vault_after = vault.amount;
```

Even though the token program updated the token account during the CPI, `vault_before` and `vault_after` can still be the same.

This surprises people because they (reasonably) expect "read again" to mean "read the updated account".

To observe the CPI side effects through Anchor's typed view, you need to reload:

```rust
    vault.reload().unwrap();
    let vault_after = vault.amount;
```

## What is Native Solana doing?

Below is a native-style example where the value you read *does* change after CPI.

```rust
    // before CPI: read from runtime memory directly
    let before = **from.lamports.borrow();
    msg!("Before CPI: {}", before);

    invoke(
        &system_instruction::transfer(from.key, to.key, 1_000),
        &[from.clone(), to.clone(), system_program.clone()],
    )?;

    // after CPI: borrow again, read the same runtime memory
    let after = **from.lamports.borrow();
    msg!("After CPI: {}", after);
```

During execution, Solana programs do not operate on the ledger directly. Instead, accounts are loaded into the runtime as a working set, and instructions mutate that in-memory state.

In the snippet above, `from` is an `AccountInfo`, and `from.lamports.borrow()` reads the lamports *from the runtime state*. After CPI, borrowing again reads the updated runtime value.

Important nuance: this "auto-updates" property comes from re-borrowing the *underlying bytes/lamports* from `AccountInfo`. If you deserialize account data into your own struct and keep that struct around, *that struct is still just a snapshot* (more on this later).

## How is Anchor handling this?

Let's take a look at the [`Account`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/accounts/account.rs#L226-L230) struct in Anchor:
```rust
#[derive(Clone)]
pub struct Account<'info, T: AccountSerialize + AccountDeserialize + Clone> {
    account: T,
    info: &'info AccountInfo<'info>,
}
```

Anchor's `Account<'info, T>` is a wrapper around:

- `info`: the `AccountInfo` handle to the runtime account
- `account`: a deserialized `T` value (a cached view)

`AccountInfo` contains the live, runtime-owned fields (lamports and raw data bytes):

```rust
/// Account information
#[derive(Clone)]
#[repr(C)]
pub struct AccountInfo<'a> {
    /// Public key of the account
    pub key: &'a Pubkey,
    /// The lamports in the account.  Modifiable by programs.
    pub lamports: Rc<RefCell<&'a mut u64>>,
    /// The data held in this account.  Modifiable by programs.
    pub data: Rc<RefCell<&'a mut [u8]>>,
    /// Program that owns this account
    pub owner: &'a Pubkey,
    /// The epoch at which this account will next owe rent
    pub rent_epoch: Epoch,
    /// Was the transaction signed by this account's public key?
    pub is_signer: bool,
    /// Is the account writable?
    pub is_writable: bool,
    /// This account's data contains a loaded program (and is now read-only)
    pub executable: bool,
}
```

### When interacting with `info`

When you call something like `get_lamports()` (Anchor's `Lamports` helpers), you're reading through `AccountInfo`:

```rust
impl<'info, T: AccountSerialize + AccountDeserialize + Clone> AsRef<AccountInfo<'info>>
    for Account<'info, T>
{
    fn as_ref(&self) -> &AccountInfo<'info> {
        self.info
    }
}
```

And we can see the [`get_lamports`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/lib.rs#L266-L312) is actually using [`as_ref`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/accounts/account.rs#L397-L403) to get the `AccountInfo`, and then borrow the `lamports` from the `AccountInfo`.

```rust
/// Lamports related utility methods for accounts.
pub trait Lamports<'info>: AsRef<AccountInfo<'info>> {
    /// Get the lamports of the account.
    fn get_lamports(&self) -> u64 {
        self.as_ref().lamports()
    }
    // ... other methods
}
```

All the `add_lamports` and `sub_lamports` are actually borrowing the `mut` version of the `lamports` from the `AccountInfo`.

```rust
    /// Add lamports to the account.
    ///
    /// This method is useful for transferring lamports from a PDA.
    ///
    /// # Requirements
    ///
    /// 1. The account must be marked `mut`.
    /// 2. The total lamports **before** the transaction must equal to total lamports **after**
    ///    the transaction.
    /// 3. `lamports` field of the account info should not currently be borrowed.
    ///
    /// See [`Lamports::sub_lamports`] for subtracting lamports.
    fn add_lamports(&self, amount: u64) -> Result<&Self> {
        **self.as_ref().try_borrow_mut_lamports()? = self
            .get_lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(self)
    }

    /// Subtract lamports from the account.
    ///
    /// This method is useful for transferring lamports from a PDA.
    ///
    /// # Requirements
    ///
    /// 1. The account must be owned by the executing program.
    /// 2. The account must be marked `mut`.
    /// 3. The total lamports **before** the transaction must equal to total lamports **after**
    ///    the transaction.
    /// 4. `lamports` field of the account info should not currently be borrowed.
    ///
    /// See [`Lamports::add_lamports`] for adding lamports.
    fn sub_lamports(&self, amount: u64) -> Result<&Self> {
        **self.as_ref().try_borrow_mut_lamports()? = self
            .get_lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        Ok(self)
    }
```

So lamports behave like native Solana: as long as you re-borrow, you're reading the latest runtime value.

### When interacting with `account`

Unlike `info`, the `account` field (type `T`) is a deserialized snapshot of the account *data bytes*.

At the start of the instruction, Anchor constructs your accounts by deserializing them in the generated handler (see the "Deserialize accounts" section in [`handlers.rs`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/syn/src/codegen/program/handlers.rs#L121-L136)):

```rust
                    // Deserialize accounts.
                    let mut __remaining_accounts: &[AccountInfo] = __accounts;
                    let mut __accounts = #anchor::try_accounts(
                        __program_id,
                        &mut __remaining_accounts,
                        __ix_data,
                        &mut __bumps,
                        &mut __reallocs,
                    )?;
```

Later, `Account::try_from` deserializes `T` from `info.data` (in the referenced commit it uses `try_deserialize_unchecked` here):

```rust
/// Deserializes the given `info` into an `Account`.
#[inline(never)]
pub fn try_from(info: &'a AccountInfo<'a>) -> Result<Account<'a, T>> {
        if info.owner == &system_program::ID && info.lamports() == 0 {
            return Err(ErrorCode::AccountNotInitialized.into());
        }
        if info.owner != &T::owner() {
            return Err(Error::from(ErrorCode::AccountOwnedByWrongProgram)
                .with_pubkeys((*info.owner, T::owner())));
        }
        let mut data: &[u8] = &info.try_borrow_data()?;
        Ok(Account::new(info, T::try_deserialize_unchecked(&mut data)?))
}
```

This is the key: `T` is copied into your program's stack/heap as a Rust value. It's not a live reference to the runtime bytes.

So after CPI, even if the account data bytes in runtime memory change, the cached `T` inside `Account<T>` does not change. But `AccountInfo`-based reads (like lamports helpers) still reflect the latest runtime state.

```
┌─────────────────────────────┐
│        Runtime Memory       │
│  (AccountInfo, live state)  │
│                             │
│   ┌───────────────┐         │
│   │   lamports    │         │
│   │   data[...]   │         │
│   └───────────────┘         │
│           ▲                 │
│           │ CPI modifies     │
│           │                  │
└───────────┴─────────────────┘
            │
            ▼
 ┌───────────────────────────┐
 │    Anchor Execution       │
 │      Context / View       │
 │                           │
 │   ┌───────────────┐       │
 │   │ Account<T>    │       │
 │   │  struct data  │  ←── Detached snapshot
 │   └───────────────┘       │
 │   Reads here see stale    │
 │   CPI changes do NOT      │
 │   automatically update    │
 │   view                    │
 └───────────────────────────┘

Note:
- Writes to `Account<T>` inside your program can be serialized back to `AccountInfo` at the end of the instruction
- Detachment only means CPI / runtime changes do not propagate automatically into the view
```

One more nuance that matters for security: if `T` is **owned by your program** and the account is not closed, Anchor will serialize your cached `T` back into the account at the end of the instruction. If you keep a stale cached `T` after CPI and then mutate it, you can unintentionally overwrite CPI changes.

A simple example:
1. You make a copy of the data from runtime memory, both the original and your copy have value 1
2. The CPI modifies the runtime memory, changing the value to 2
3. But since you are not holding a reference to the runtime memory, the value in your copy remains 1
4. So, when you read the value from your copy again, it will still be 1, even though the runtime memory now has 2

### What is reloading doing?

When you call `reload()` (see [`account.rs`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/accounts/account.rs#L298-L324)):

Anchor's docs say "reload from storage", but in practice this re-reads and deserializes from the current `AccountInfo.data` bytes held by the runtime.

```rust
    /// Reloads the account from storage. This is useful, for example, when
    /// observing side effects after CPI.
    ///
    /// This method also re-validates that the program owner has not
    /// changed since the initial validation
    pub fn reload(&mut self) -> Result<()> {
        if self.info.owner != &T::owner() {
            return Err(Error::from(ErrorCode::AccountOwnedByWrongProgram)
                .with_pubkeys((*self.info.owner, T::owner())));
        }

        let mut data: &[u8] = &self.info.try_borrow_data()?;
        self.account = T::try_deserialize(&mut data)?; // deserialize again from the (now-updated) runtime bytes
        Ok(())
    }

```

`reload()` re-deserializes from the *current* `AccountInfo.data` bytes, updating the cached `T` so subsequent field reads (like `vault.amount`) reflect CPI side effects.

### The final writeback for anchor account

After your handler returns, the generated code runs an exit routine (see [`handlers.rs`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/syn/src/codegen/program/handlers.rs#L145-L160)):

```rust
                    // Exit routine.
                    __accounts.exit(__program_id)
```

In the [`exit`](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/accounts/account.rs#L362-L369):

```rust
impl<'info, T: AccountSerialize + AccountDeserialize + Owner + Clone> AccountsExit<'info>
    for Account<'info, T>
{
    fn exit(&self, program_id: &Pubkey) -> Result<()> {
        self.exit_with_expected_owner(&T::owner(), program_id)
    }
}
```

[This function](https://github.com/solana-foundation/anchor/blob/d7ace7a47d9720386d5ddc1690f358e2d1d33ff5/lang/src/accounts/account.rs#L252-L287) persists the cached `T` back into the account data *only if* the account is owned by the currently executing program (and not closed):

```rust

    pub(crate) fn exit_with_expected_owner(
        &self,
        expected_owner: &Pubkey,
        program_id: &Pubkey,
    ) -> Result<()> {
        // Only persist if the owner is the current program and the account is not closed.
        if expected_owner == program_id && !crate::common::is_closed(self.info) {
            let mut data = self.info.try_borrow_mut_data()?;
            let dst: &mut [u8] = &mut data;
            let mut writer = BpfWriter::new(dst);
            self.account.try_serialize(&mut writer)?;
        }
        Ok(())
    }
```

## Can Native Solana Always Avoid Reloading?

No!

```rust
    let mut user = User::deserialize(&mut user_info.try_borrow_data()?.as_ref())?;
    invoke(...)?;
    msg!("User balance after: {}", user.balance);
```

Manually deserializing account data and using `Account<T>` in Anchor are semantically equivalent.
Both create a cached snapshot detached from runtime state. CPI invalidates both!

The general rule is:

- If you're reading from `AccountInfo` (borrowing lamports or borrowing the raw data bytes and then deserializing *after* CPI), you can see the updated state.
- If you deserialized *before* CPI and kept the Rust struct around, you have a stale snapshot.

## Practical rule of thumb

Reload (or re-deserialize) when all of the following are true:

1. You perform a CPI that may mutate an account's **data** (not just lamports).
2. You need to **read/validate** that mutated data later in the same instruction.
3. You are reading through a cached struct (`Account<T>`, `AccountLoader`, or your own deserialized Rust type).

If you're only checking lamports via `AccountInfo`-based helpers, reloading is usually not necessary.

## Conclusion

The key takeaway is that Anchor's `Account<T>` provides a convenient, type-safe wrapper around account data, but the typed fields you read (via `Deref<Target = T>`) come from a cached snapshot.

After CPI, runtime memory may have changed, but your cached `T` has not—so you must `reload()` (or otherwise re-deserialize) when you want to observe CPI side effects through that typed view.

In contrast, native Solana patterns that re-borrow from `AccountInfo` let you see the latest runtime state, but you still need to be mindful of cached deserialized structs. Understanding where you're reading from (live `AccountInfo` vs cached `T`) is crucial for writing correct Solana programs.