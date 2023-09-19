[![npm version](https://badge.fury.io/js/@doodlesteam%2Fflooks.svg)](https://badge.fury.io/js/@doodlesteam%2Fflooks)

# Flooks (Beta)

Flooks is a library that provides React hooks to interact with Flow blockchain, making development easy and intuitive. It's wagmi for Flow!

### 🚧 Work In Progress 🚧

This package is currently in beta. While we are putting a lot of effort into ensuring it's as robust as possible, you may encounter breaking changes or occasional bugs. If you find value in what we're building, please consider giving us a ⭐. Your feedback and stars motivate us to make this package the best way to integrate Flow in any React app!

## Table of contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Account](#account)
  - [Scripts](#scripts)
  - [Transactions](#transactions)
  - [Events](#events)
- [License](#license)

## Install

```sh
npm install @doodlesteam/flooks
```

## Quick Start

Configure your Flow connection and add a FlowProvider:

```ts
import { FlowProvider, configureChains } from '@doodlesteam/flooks';
import Profile from './Profile';

configureChains({
  title: 'MyDapp',
  accessNodeApi: 'https://rest-testnet.onflow.org',
  discoveryWallet: 'https://staging.accounts.meetdapper.com/fcl/authn-restricted',
  network: 'testnet',
});

function App() {
  return (
    <FlowProvider>
      <Profile />
    </FlowProvider>
  );
}
```

Inside the profile, you can add more hooks to handle connection:

```ts
import {
  useFlowAccount,
  useFlowConnect,
  useFlowDisconnect
} from '@doodlesteam/flooks';

function Profile() {
  const { address } = useFlowAccount();
  const { connect } = useFlowConnect();
  const { disconnect } = useFlowDisconnect();

  if (address)
    return (
      <div>
        Connected to {address}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  return <button onClick={() => connect()}>Connect Wallet</button>;
}
```

## Usage

### Account

`useFlowAccount` provides you with callbacks to handle connection:

```ts
import { useFlowAccount } from '@doodlesteam/flooks';
import { useAccountContext } from '../contexts/AccountContext';

function Component {
  const { dispatch } = useAccountContext();

  const account = useFlowAccount({
    onConnect: (connectedAccount: ) => {
      dispatch({ type: 'accountConnected', payload: connectedAccount });
    },
    onDisconnect: () => {
      dispatch({ type: 'accountDisconnected' });
    },
  });

  // Rest of the code...
}
```

### Scripts

You can fetch data from the blockchain using `useFlowScript`:

```ts
import { useFlowScript } from '@doodlesteam/flooks';

const script = `
  pub fun main(x: Int, y: Int): Int {
    return x + y
  }`;

function Component {
  const { data } = useFlowScript<number>({
    code: script,
    args: [1, 2],
  });

  // Rest of the code...
}
```

Arguments are automatically parsed and validated from your script, so you don't have to specify each argument type manually.

You can optionally define the expected result type. In this case `data` will be a number.

Flooks uses [react-query](https://www.npmjs.com/package/@tanstack/react-query) in the background, so you also get all its features, like retries and refetch intervals.

---

Doing the same with fcl:

```ts
import { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";

const script = `
  pub fun main(x: Int, y: Int): Int {
    return x + y
  }`;

function Component {
  const [result, setResult] = useState<number>();

  useEffect(() => {
    fcl.query({
      cadence: script,
      args: (arg, t) => [arg("1", t.Int), arg("2", t.Int)],
    }).then((data) => {
      setResult(data);
    });
  }, []);

  // Rest of the code...
}
```

### Transactions

Execute transactions using `useFlowTransaction`:

```ts
import { useFlowTransaction } from '@doodlesteam/flooks';

const transaction = `
  import NonFungibleToken from 0x...
  import Doodles from 0x...

  transaction(recipient: Address, nftID: UInt64) {
    let withdrawRef: &Doodles.Collection
    let depositRef: &Doodles.Collection{NonFungibleToken.Receiver}

    prepare(signer: AuthAccount) {
      self.withdrawRef = signer.borrow<&Doodles.Collection>(from: Doodles.CollectionStoragePath)
        ?? panic("Account does not store an object at the specified path")

      self.depositRef = getAccount(recipient).getCapability(Doodles.CollectionPublicPath)
        .borrow<&Doodles.Collection{NonFungibleToken.CollectionPublic}>()
          ?? panic("Could not borrow a reference to the receiver's collection")
    }

    execute {
      let nft <- self.withdrawRef.withdraw(withdrawID: nftID)
      self.depositRef.deposit(token: <-nft)
    }
  }`;

function Component {
  const { execute, isIdle, isLoading, isSealed, isError } =
    useFlowTransaction({
      code: transaction,
      args: ['0x...', 1],
      onTransactionSealed(result) {
        console.log('Transaction completed!', result.transactionId);
        for (const event of result.events) {
          console.log(event.type, event.data);
        }
      },
      onTransactionError(result) {
        console.error(result.error);
      },
    });

  return (
    <button disabled={!isIdle} onClick={() => execute()}>
      {isIdle && 'Transfer NFT'}
      {isLoading && 'Loading...'}
      {isSealed && 'Sealed!'}
      {isError && 'Error'}
    </button>
  );
}
```

`useFlowTransaction` also provides you with automatic parsed and validated arguments, and also subscribes to transaction status.

---

Doing the same with fcl:

```ts
import { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";

const transaction = `
  import NonFungibleToken from 0x...
  import Doodles from 0x...

  transaction(recipient: Address, nftID: UInt64) {
    let withdrawRef: &Doodles.Collection
    let depositRef: &Doodles.Collection{NonFungibleToken.Receiver}

    prepare(signer: AuthAccount) {
      self.withdrawRef = signer.borrow<&Doodles.Collection>(from: Doodles.CollectionStoragePath)
        ?? panic("Account does not store an object at the specified path")

      self.depositRef = getAccount(recipient).getCapability(Doodles.CollectionPublicPath)
        .borrow<&Doodles.Collection{NonFungibleToken.CollectionPublic}>()
          ?? panic("Could not borrow a reference to the receiver's collection")
    }

    execute {
      let nft <- self.withdrawRef.withdraw(withdrawID: nftID)
      self.depositRef.deposit(token: <-nft)
    }
  }`;

function Component {
  const [txStatus, setTxStatus] = useState();
  const [txUnsubscribe, setTxUnsubscribe] = useState();

  const execute = async () => {
    const transactionId = await fcl.mutate({
      cadence: transaction,
      args: (arg, t) => [arg("0x...", t.Address), arg("1", t.UInt64)],
    });

    const unsubscribe = fcl.tx(txId).subscribe(setTxStatus);
    setTxUnsubscribe(unsubscribe);
  }

  useEffect(() => {
    if (txStatus?.status === 4) {
      console.log('Transaction completed!', txStatus.transactionId);
      for (const event of txStatus.events) {
        console.log(event.type, event.data);
      }
      txUnsubscribe();
    } else if (txStatus?.errorMessage !== '') {
      console.error(result.error);
      txUnsubscribe();
    }
  }, [txStatus]);

  return (
    <button disabled={!isIdle} onClick={() => execute()}>
      {!txStatus && 'Transfer NFT'}
      {[1, 2, 3].includes(txStatus?.status) && 'Loading...'}
      {txStatus?.status === 4 && 'Sealed!'}
      {txStatus?.errorMessage !== '' && 'Error'}
    </button>
  );
}
```

### Events

You can subscribe to events using `useFlowEvent`:

```ts
import { useFlowEvent } from '@doodlesteam/flooks';

interface TokensWithdrawnData {
  amount: string;
  from: string
};

function Component {
  useFlowEvent<TokensWithdrawnData>({
    eventName: {
      contractAddress: '0x7e60df042a9c0868', // Flooks will automatically remove the '0x' prefix
      contractName: 'FlowToken',
      eventName: 'TokensWithdrawn',
    },
    listener: (event: TokensWithdrawnData) => {
      console.log('TokensWithdrawn', event.amount, event.from);
    },
  });

  // Rest of the code...
}
```

You can also pass the `eventName` argument as a string like fcl:

```
eventName: 'A.7e60df042a9c0868.FlowToken.TokensWithdrawn',
```

Are you waiting just for the first event emitted? Use the `once` argument:

```ts
import { useFlowEvent } from '@doodlesteam/flooks';

function Component {
  useFlowEvent<{winner: string}>({
    eventName: {
      contractAddress: '...',
      contractName: 'Auction',
      eventName: 'ClosedAuction',
    },
    once: true,
    listener: (event) => {
      // This will only be executed once
      console.log('Winner address', event.winner);
    },
  });

  // Rest of the code...
}
```

## License

[MIT License](./LICENSE)
