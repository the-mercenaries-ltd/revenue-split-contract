use std::str::FromStr;
use anchor_lang::prelude::*;
use solana_program;
use solana_program::{
    clock::Clock,
    account_info::AccountInfo,
    entrypoint::ProgramResult, program::invoke, program::invoke_signed, system_instruction,
};
declare_id!("CH4VVZcJEhyxKEySW9oB31om1yyfX1FJtJ9qW61hZ8Br");

#[program]
pub mod anchor {
    use super::*;
    pub fn init_pool_account(ctx: Context<InitPoolAccount>, bump: u8, extra_lamports: u64) -> ProgramResult {
        let payer = &mut ctx.accounts.payer;
        let system_program = &ctx.accounts.system_program;
        let pool_account = &ctx.accounts.pool_account;
        invoke(
            &system_instruction::transfer(
                &payer.to_account_info().key,
                &pool_account.to_account_info().key,
                extra_lamports, 
            ),
            &[
                payer.to_account_info().clone(),
                pool_account.to_account_info().clone(),
                system_program.to_account_info().clone(),
            ],
        )?;
        Ok(())
    }
    pub fn split(ctx: Context<Split>, bump: u8) -> ProgramResult {
        let pool_account = &ctx.accounts.pool_account.to_account_info();
        let jacks_account = &mut ctx.accounts.jacks_account.to_account_info();
        let the_brothers_account = &mut ctx.accounts.the_brothers_account.to_account_info();
        let the_dao_account = &mut ctx.accounts.the_dao_account.to_account_info();

        let correct_jacks_account_key = Pubkey::from_str("EAdiYGQ2m9A1AzVABRwFakh6aTtY5FDFkRYpZ6ijTvXP").unwrap();
        let correct_the_brothers_account_key = Pubkey::from_str("C7v5L2AdUcD42rGKik5bxH5HcnWUriN1ScWbLFZU7icE").unwrap();
        let correct_the_daos_account_key = Pubkey::from_str("5o3YBSyzqzBxbgporUmtSABFYHj5g3BX8swa7kQD9WnV").unwrap();

        if &jacks_account.key() != &correct_jacks_account_key {
            msg!("InvalidJacksAccountKey");
            return Err(ErrorCode::InvalidJacksAccountKey.into())
        }

        if &the_brothers_account.key() != &correct_the_brothers_account_key {
            msg!("InvalidTheBrothersAccountKey");
            return Err(ErrorCode::InvalidTheBrothersAccountKey.into())
        }

        if &the_dao_account.key() != &correct_the_daos_account_key {
            msg!("InvalidTheDaosAccountKey");
            return Err(ErrorCode::InvalidTheDaosAccountKey.into())
        }

        let lamports_for_rent = 946560;
        let lamports_to_send_jack = ((pool_account.lamports() - lamports_for_rent) as f64  * 0.05) as u64;
        let lamports_to_send_the_brothers = ((pool_account.lamports() - lamports_for_rent) as f64  * 0.75) as u64;
        let lamports_to_send_the_dao = ((pool_account.lamports() - lamports_for_rent) as f64  * 0.20) as u64;
        let lamports_total_to_send = lamports_to_send_jack + lamports_to_send_the_brothers + lamports_to_send_the_dao;

        **pool_account.try_borrow_mut_lamports()? = pool_account
            .lamports()
            .checked_sub(lamports_total_to_send)
            .ok_or(ProgramError::InvalidArgument)?;

        **jacks_account.try_borrow_mut_lamports()? = jacks_account
            .lamports()
            .checked_add(lamports_to_send_jack)
            .ok_or(ProgramError::InvalidArgument)?;

        **the_brothers_account.try_borrow_mut_lamports()? = the_brothers_account
            .lamports()
            .checked_add(lamports_to_send_the_brothers)
            .ok_or(ProgramError::InvalidArgument)?;

        **the_dao_account.try_borrow_mut_lamports()? = the_dao_account
            .lamports()
            .checked_add(lamports_to_send_the_dao)
            .ok_or(ProgramError::InvalidArgument)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitPoolAccount<'info> {
    #[account(init, payer = payer, space = 8, seeds = [b"escrow"], bump = bump)]
    pub pool_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Split<'info> {
    #[account(mut)]
    pub pool_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub jacks_account: AccountInfo<'info>,
    #[account(mut)]
    pub the_brothers_account: AccountInfo<'info>,
    #[account(mut)]
    pub the_dao_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
  
#[account]
pub struct BaseAccount {
}

#[error]
pub enum ErrorCode {
    #[msg("InvalidJacksAccountKey")]
    InvalidJacksAccountKey,
    #[msg("InvalidTheBrothersAccountKey")]
    InvalidTheBrothersAccountKey,
    #[msg("InvalidTheDaosAccountKey")]
    InvalidTheDaosAccountKey,
}