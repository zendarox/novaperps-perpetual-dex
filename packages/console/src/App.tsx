import { WalletProvider } from "./lib/wallet";
import { TopBar, BootHealth } from "./components/layout/TopBar";
import { TabShell } from "./components/layout/TabShell";
import { TradePanel } from "./components/trade/TradePanel";
import { MarketsView } from "./components/markets/MarketsView";
import { PortfolioView } from "./components/portfolio/PortfolioView";
import { VaultsView } from "./components/vaults/VaultsView";
import { StatsView } from "./components/stats/StatsView";
import { RiskView } from "./components/risk/RiskView";
import { ReviewView } from "./components/risk/ReviewView";
import { PROTOCOL } from "@novaperps/shared";

export default function App() {
  return (
    <WalletProvider>
      <div className="ambient" />
      <div className="shell">
        <BootHealth />
        <TopBar />
        <TabShell
          views={{
            trade: <TradePanel />,
            markets: <MarketsView />,
            portfolio: <PortfolioView />,
            vaults: <VaultsView />,
            stats: <StatsView />,
            risk: <RiskView />,
            review: <ReviewView />,
          }}
        />
        <footer className="footer">
          {PROTOCOL.name} · v{PROTOCOL.version} · @novaperps/console · npm run server
        </footer>
      </div>
    </WalletProvider>
  );
}
