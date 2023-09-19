[![npm version](https://badge.fury.io/js/@doodlesteam%2Fflooks.svg)](https://badge.fury.io/js/@doodlesteam%2Fflooks)

# Flooks

Flooks is a library that provides React hooks for connecting to the Flow blockchain. It is designed to simplify the process of integrating Flow into your React applications. It's wagmi for Flow!

## Install

```sh
npm install @doodlesteam/flooks
```

## Quick Start

Configure your Flow connection and add a FlowProvider:

```
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

```
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

### Scripts

You can fetch data from the blockchain using `useFlowScript`:

```
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

Doing the same with fcl:

```
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

## License

[MIT License](./LICENSE)
