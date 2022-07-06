import { SolanaAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { SOLANA_MAINNET_CHAIN_REF } from "@ceramicnetwork/blockchain-utils-linking/lib/solana";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { Connection, PublicKey } from "@solana/web3.js";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { PhantomProvider } from "../types";
import getProvider from "../utils/getProvider";
import * as KeyDidResolver from "key-did-resolver";
import signMessage from "../utils/signMessage";

const NETWORK = "https://solana-api.projectserum.com";
const CERAMIC_API_URL = "http://localhost:7007";
const connection = new Connection(NETWORK);

const Home: NextPage = () => {
  const [provider, setProvider] = useState<PhantomProvider | undefined>();
  const [publicKey, setPubilcKey] = useState<PublicKey | null>();
  const [deterministicDoc, setDeterministicDoc] = useState<TileDocument<any>>();
  const [dappDidKey, setDappDidKey] = useState("");

  const handleSignMessage = async (message: string) => {
    if (!provider) return;

    try {
      const signedMessage = await signMessage(provider, message);
      return signedMessage;
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnect = async () => {
    if (!provider) return;

    try {
      const pubKey = await provider.connect();
      setPubilcKey(pubKey.publicKey);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setPubilcKey(null);
    } catch (error) {
      console.error(error);
    }
  };

  const createDeterministicDoc = async () => {
    try {
      console.log("Creating deterministic document...");
      const ceramic = getCeramicClient();
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: Math.random().toString(36).substring(2, 5),
        controllers: [
          `did:pkh:solana:${SOLANA_MAINNET_CHAIN_REF}:${publicKey!.toBase58()}`,
        ],
      });
      setDeterministicDoc(deterministicDocument);
      console.log("Deterministic document created", deterministicDocument);
      return deterministicDocument;
    } catch (error) {
      console.error(error);
    }
  };

  const getDappDidKey = async () => {
    // use hard coded seed for example
    const seed = new Uint8Array([
      69, 90, 79, 1, 19, 168, 234, 177, 16, 163, 37, 8, 233, 244, 36, 102, 130,
      190, 102, 10, 239, 51, 191, 199, 40, 13, 2, 63, 94, 119, 183, 225,
    ]);

    const didProvider = new Ed25519Provider(seed);
    const didKey = new DID({
      provider: didProvider,
      resolver: KeyDidResolver.getResolver(),
    });
    await didKey.authenticate();
    setDappDidKey(didKey.id);
    return didKey;
  };

  const getSolanaAuthProvider = async () => {
    if (!publicKey) throw new Error("Wallet not connected");

    return new SolanaAuthProvider(
      provider,
      publicKey.toBase58(),
      SOLANA_MAINNET_CHAIN_REF
    );
  };

  const getCeramicClient = () => {
    const ceramic = new CeramicClient(CERAMIC_API_URL);
    return ceramic;
  };

  useEffect(() => {
    const prov = getProvider();
    setProvider(prov);
    setPubilcKey(prov?.publicKey);
  }, []);

  if (!provider) {
    return <h2>No Provider Found</h2>;
  }

  return (
    <div>
      {provider.publicKey ? (
        <div>
          <span>Connected to {provider.publicKey.toBase58()}</span>
          <button onClick={handleDisconnect}>Disconnect Wallet</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect to Phantom</button>
      )}
    </div>
  );
};

export default Home;
