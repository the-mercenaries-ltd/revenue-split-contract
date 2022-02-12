import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Anchor } from '../target/types/anchor';
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;
import { PublicKey, Keypair } from "@solana/web3.js";
const { assert } = require('chai');

describe('anchor', async () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);  
  const connection = await anchor.getProvider().connection;

  const program = anchor.workspace.Anchor as Program<Anchor>;

  let lamportsForRent = 946560;
  let extraLamports = LAMPORTS_PER_SOL * 0.1;

  const jacksAccount = new PublicKey("EAdiYGQ2m9A1AzVABRwFakh6aTtY5FDFkRYpZ6ijTvXP");
  const theBrothersAccount = new PublicKey("C7v5L2AdUcD42rGKik5bxH5HcnWUriN1ScWbLFZU7icE");
  const theDaoAccount = new PublicKey("5o3YBSyzqzBxbgporUmtSABFYHj5g3BX8swa7kQD9WnV");
  const randomKeypair = Keypair.generate();

  it(`init pool account with ${extraLamports} lamport and space rent (${lamportsForRent} + ${extraLamports} lamports)`, async () => {
    const [poolAccount, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);

    const initTx = await program.rpc.initPoolAccount(
      bump, 
      new anchor.BN(extraLamports),
      {
        accounts: {
          poolAccount,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      }
    );
  
    let poolAccountBalance = await connection.getBalance(poolAccount);
    assert.equal(poolAccountBalance, lamportsForRent + extraLamports);
  });

  it(`if jacks key is incorrect, throw error`, async () => {
    const [poolAccount, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);

    try {
      const splitTx = await program.rpc.split(
        bump, 
        {
        accounts: {
          poolAccount,
          jacksAccount: randomKeypair.publicKey,
          theBrothersAccount,
          theDaoAccount,
          systemProgram: SystemProgram.programId,
        },
      });
      assert.equal(true, false, "should not have gotten this far if jack's key is incorrect");
    } catch(error) {
      if (error instanceof Error) {
        assert.equal(error.message, "6000: InvalidJacksAccountKey");
      }
    }
  });

  it(`if the brothers key is incorrect, throw error`, async () => {
    const [poolAccount, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);

    try {
      const splitTx = await program.rpc.split(
        bump, 
        {
        accounts: {
          poolAccount,
          jacksAccount,
          theBrothersAccount: randomKeypair.publicKey,
          theDaoAccount,
          systemProgram: SystemProgram.programId,
        },
      });
      assert.equal(true, false, "should not have gotten this far if the brother's key is incorrect");
    } catch(error) {
      if (error instanceof Error) {
        assert.equal(error.message, "6001: InvalidTheBrothersAccountKey");
      }
    }
  });

  it(`if the dao's key is incorrect, throw error`, async () => {
    const [poolAccount, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);

    try {
      const splitTx = await program.rpc.split(
        bump, 
        {
        accounts: {
          poolAccount,
          jacksAccount,
          theBrothersAccount,
          theDaoAccount: randomKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      assert.equal(true, false, "should not have gotten this far if the dao's key is incorrect");
    } catch(error) {
      if (error instanceof Error) {
        assert.equal(error.message, "6002: InvalidTheDaosAccountKey");
      }
    }
  });

  it(`
    of the extra lamports...
    a. 5% should be sent to Jack 
    b. 75% should be sent to the brothers
    c. 20% should be sent to the DAO
  `, async () => {
    const [poolAccount, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId)
  
    const splitTx = await program.rpc.split(
      bump, 
      {
      accounts: {
        poolAccount,
        jacksAccount,
        theBrothersAccount,
        theDaoAccount,
        systemProgram: SystemProgram.programId,
      },
    });
    console.log("splitTx", splitTx)

    let jacksBalance = await connection.getBalance(jacksAccount);
    assert.equal(jacksBalance, extraLamports * 0.05, "jack's balance is wrong");

    let theBrothersBalance = await connection.getBalance(theBrothersAccount);
    assert.equal(theBrothersBalance, extraLamports * 0.75, "the brother's balance is wrong");

    let theDaosBalance = await connection.getBalance(theDaoAccount);
    assert.equal(theDaosBalance, extraLamports * 0.20, "the DAO's balance is wrong");
  });

  // setInterval(() => {}, 1 << 30)

});