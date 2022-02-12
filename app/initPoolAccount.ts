import * as anchor from "@project-serum/anchor";
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

anchor.setProvider(anchor.Provider.local("https://api.mainnet-beta.solana.com"));

async function main() {
    const provider: anchor.Provider = anchor.Provider.local("https://api.mainnet-beta.solana.com");
    const idl = JSON.parse(require('fs').readFileSync('/Users/ph/Projects/alpha-bets/revenue-split-contract/anchor/target/idl/anchor.json', 'utf8'));
    const programId = new anchor.web3.PublicKey('CH4VVZcJEhyxKEySW9oB31om1yyfX1FJtJ9qW61hZ8Br');
    const program: Program = new anchor.Program(idl, programId);

    let extraLamports = LAMPORTS_PER_SOL * 0.01;
    
    console.log({})

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

    console.log("initTx", initTx)

    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
  
