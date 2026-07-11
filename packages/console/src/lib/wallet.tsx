import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { hardhat } from "viem/chains";

export const novaChain = {
  ...hardhat,
  id: 31337,
  name: "Nova Local",
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
} as const satisfies Chain;

type WalletState = {
  address?: Address;
  chainId?: number;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToLocal: () => Promise<void>;
  isConnected: boolean;
};

const Ctx = createContext<WalletState | null>(null);

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("WalletProvider missing");
  return v;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>();

  const publicClient = useMemo(
    () => createPublicClient({ chain: novaChain, transport: http("http://127.0.0.1:8545") }),
    []
  );

  const refresh = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    const cid = Number(await eth.request({ method: "eth_chainId" }));
    setChainId(cid);
    if (accounts[0]) {
      const addr = accounts[0] as Address;
      setAddress(addr);
      setWalletClient(createWalletClient({ chain: novaChain, transport: custom(eth), account: addr }));
    } else {
      setAddress(undefined);
      setWalletClient(undefined);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const eth = window.ethereum;
    if (!eth?.on) return;
    const onAcc = () => void refresh();
    const onChain = () => void refresh();
    eth.on("accountsChanged", onAcc);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAcc);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("Install MetaMask");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await refresh();
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setWalletClient(undefined);
  }, []);

  const switchToLocal = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x7a69" }] });
    } catch {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69",
            chainName: "Nova Local",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    }
    await refresh();
  }, [refresh]);

  return (
    <Ctx.Provider
      value={{
        address,
        chainId,
        publicClient,
        walletClient,
        connect,
        disconnect,
        switchToLocal,
        isConnected: !!address,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}
