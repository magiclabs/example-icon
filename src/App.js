import React, { useState, useEffect } from "react";
import "./styles.css";
import { content } from './data/contract'
import { Magic } from "magic-sdk";
import { IconExtension } from "@magic-ext/icon";
import IconService from "icon-sdk-js";

const { IconBuilder, IconAmount, IconConverter } = IconService;

const magic = new Magic("pk_live_391E344C33F73CF5", {
  extensions: {
    icon: new IconExtension({
      rpcUrl: "https://bicon.net.solidwallet.io/api/v3"
    })
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendICXAmount, setSendICXAmount] = useState(0);
  const [contractTxHash, setContractTxHash] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [messageTxHash, setMessageTxHash] = useState("");
  const [massageDestinationAddress, setMassageDestinationAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    magic.user.isLoggedIn().then(async magicIsLoggedIn => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const publicAddress = await magic.icon.getAccount();
        setPublicAddress(publicAddress);
        setUserMetadata(await magic.user.getMetadata());
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handlerSendTransaction = async () => {
    const metadata = await magic.user.getMetadata();

    const txObj = new IconBuilder.IcxTransactionBuilder()
      .from(metadata.publicAddress)
      .to(destinationAddress)
      .value(IconAmount.of(sendICXAmount, IconAmount.Unit.ICX).toLoop())
      .stepLimit(IconConverter.toBigNumber(100000))
      .nid(IconConverter.toBigNumber(3))
      .nonce(IconConverter.toBigNumber(1))
      .version(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .build();

    const txhash = await magic.icon.sendTransaction(txObj);

    setTxHash(txhash);

    console.log("transaction result", txhash);
  };

  const handlerMessageTransaction = async () => {
    const metadata = await magic.user.getMetadata();
    const txObj = new IconBuilder.MessageTransactionBuilder()
        .from(metadata.publicAddress)
        .to(massageDestinationAddress)
        .stepLimit(IconConverter.toBigNumber(1000000).toString())
        .nid(IconConverter.toBigNumber(3).toString())
        .nonce(IconConverter.toBigNumber(1).toString())
        .version(IconConverter.toBigNumber(3).toString())
        .timestamp((new Date()).getTime() * 1000)
        .data(IconConverter.fromUtf8(message))
        .build()

    console.log('txObj', txObj);

    const txhash = await magic.icon.sendTransaction(txObj);

    setMessageTxHash(txhash);

    console.log('transaction result', txhash);
  };

  const handleDeployContract = async () => {
    const metadata = await magic.user.getMetadata();

    const { DeployTransactionBuilder } = IconBuilder;

    const txObj = new DeployTransactionBuilder()
        .from(metadata.publicAddress)
        .to('cx0000000000000000000000000000000000000000')
        .stepLimit(IconConverter.toBigNumber(2100000000).toString())
        .nid(IconConverter.toBigNumber(3).toString())
        .nonce(IconConverter.toBigNumber(1).toString())
        .version(IconConverter.toBigNumber(3).toString())
        .timestamp((new Date()).getTime() * 1000)
        .contentType('application/zip')
        .content(`0x${content}`)
        .params({
          initialSupply: IconConverter.toHex('100000000000'),
          decimals: IconConverter.toHex(18),
          name: 'StandardToken',
          symbol: 'ST',
        })
        .build();

    const txhash = await magic.icon.sendTransaction(txObj);

    setContractTxHash(txhash);

    console.log('transaction result', txhash);

  };

  const handleContractCall = async () => {
    const metadata = await magic.user.getMetadata();

    const txObj = new IconBuilder.CallTransactionBuilder()
        .from(metadata.publicAddress)
        .to('cx568bb567298fbc60091c24080be20c1ce7751529')
        .stepLimit(IconConverter.toBigNumber('2000000').toString())
        .nid(IconConverter.toBigNumber('3').toString())
        .nonce(IconConverter.toBigNumber('1').toString())
        .version(IconConverter.toBigNumber('3').toString())
        .timestamp((new Date()).getTime() * 1000)
        .method('hello')
        .params({})
        .build();

    console.log('txObj', txObj);

    const txhash = await magic.icon.sendTransaction(txObj);

    console.log('transaction result', txhash);
    window.open(`https://bicon.tracker.solidwallet.io/transaction/${txhash}`)

  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={event => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Icon address</h1>
            <div className="info">
              <a
                href={`https://bicon.tracker.solidwallet.io/address/${publicAddress}`}
                target="_blank"
              >
                {publicAddress}
              </a>
            </div>
          </div>
          <div className="container">
            <h1>Send Transaction</h1>
            {txHash ? (
              <div>
                <div>Send transaction success</div>
                <div className="info">
                  <a
                    href={`https://bicon.tracker.solidwallet.io/transaction/${txHash}`}
                    target="_blank"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
            ) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={event => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in ICX"
              onChange={event => {
                setSendICXAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handlerSendTransaction}>
              Send Transaction
            </button>
          </div>
          <div className="container">
            <h1>Send Message Transaction</h1>
            {messageTxHash ? (
                <div>
                  <div>Send message transaction success</div>
                  <div className="info">
                    <a
                        href={`https://bicon.tracker.solidwallet.io/transaction/${messageTxHash}`}
                        target="_blank"
                    >
                      {messageTxHash}
                    </a>
                  </div>
                </div>
            ) : (
                <div />
            )}
            <input
                type="text"
                name="destination"
                className="full-width"
                required="required"
                placeholder="Destination address"
                onChange={event => {
                  setMassageDestinationAddress(event.target.value);
                }}
            />
            <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Message"
                onChange={event => {
                  setMessage(event.target.value);
                }}
            />
            <button id="btn-send-txn" onClick={handlerMessageTransaction}>
              Send Message Transaction
            </button>
          </div>
          <div className="container">
            <h1>Smart Contract</h1>
            <div className="info">
              <a
                href={`https://bicon.tracker.solidwallet.io/transaction/${contractTxHash}`}
                target="_blank"
              >
                {contractTxHash}
              </a>
            </div>
            <button id="btn-deploy" onClick={handleDeployContract}>
              Deploy Contract
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
