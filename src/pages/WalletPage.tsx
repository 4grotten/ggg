import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, QrCode, Clock, ArrowDownLeft, ArrowUpRight, CreditCard, ChevronRight, Wallet, Landmark, Plus } from "lucide-react";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { UsdtIcon, TronIcon, getCryptoIcon } from "@/components/icons/CryptoIcons";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { useMergedTransactionGroups, useCryptoTransactionGroups } from "@/hooks/useTransactions";
import { useCryptoWallets } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import { registerCryptoWallets } from "@/services/api/transactions";
import { useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

type TokenType = "USDT" | "USDC";
type NetworkId = "trc20" | "erc20";

const TOKENS_LIST: { id: TokenType; name: string; color: string; symbol: string }[] = [
  { id: "USDT", name: "Tether USDT", color: "#26A17B", symbol: "₮" },
  { id: "USDC", name: "USD Coin", color: "#2775CA", symbol: "$" },
];

const NETWORKS_LIST: { id: NetworkId; name: string }[] = [
  { id: "trc20", name: "Tron (TRC20)" },
  { id: "erc20", name: "Ethereum (ERC20)" },
];

const WalletPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qrOpen, setQrOpen] = useState(false);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [openWalletDrawer, setOpenWalletDrawer] = useState(false);
  const [walletStep, setWalletStep] = useState<'token' | 'network' | 'success'>('token');
  const [newToken, setNewToken] = useState<TokenType>("USDT");
  const [newNetwork, setNewNetwork] = useState<NetworkId>("trc20");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const { data: transactionsData, isLoading: transactionsLoading } = useMergedTransactionGroups();
  const { data: cryptoApiGroups, isLoading: cryptoApiLoading } = useCryptoTransactionGroups();
  const { data: cryptoWalletsData, isLoading: cryptoWalletsLoading } = useCryptoWallets();

  const cryptoWallets = useMemo(() => {
    return Array.isArray(cryptoWalletsData?.data) ? cryptoWalletsData.data : [];
  }, [cryptoWalletsData]);

  const wallet = useMemo(() => {
    if (!cryptoWallets.length) {
      return null;
    }

    const preferredWallet =
      cryptoWallets.find(
        (item) => item.token?.toUpperCase() === "USDT" && item.network?.toUpperCase() === "TRC20"
      ) ?? cryptoWallets[0];

    if (!selectedWalletId) {
      return preferredWallet;
    }

    return cryptoWallets.find((item) => item.id === selectedWalletId) ?? preferredWallet;
  }, [cryptoWallets, selectedWalletId]);

  const hasWallets = cryptoWallets.length > 0;
  const usdtBalance = wallet ? parseFloat(String(wallet.balance ?? 0)) : 0;
  const walletAddress = wallet?.address ?? "—";
  const walletToken = wallet?.token?.toUpperCase() ?? "USDT";
  const walletNetwork = wallet?.network?.toUpperCase() ?? "TRC20";

  const transactionGroups = useMemo(() => {
    const groups = transactionsData?.groups || [];
    const cryptoTypes = ["topup", "crypto_withdrawal", "crypto_deposit", "top_up", "withdrawal"];
    const mockCryptoGroups = groups
      .map(group => ({
        ...group,
        transactions: group.transactions.filter(tx =>
          cryptoTypes.includes(tx.type || "") ||
          tx.description?.toLowerCase().includes("crypto") ||
          tx.description?.toLowerCase().includes("usdt") ||
          tx.merchant?.toLowerCase().includes("usdt") ||
          tx.merchant?.toLowerCase().includes("trc20")
        ),
      }))
      .filter(group => group.transactions.length > 0);

    return [...(cryptoApiGroups || []), ...mockCryptoGroups];
  }, [transactionsData, cryptoApiGroups]);

  const copyToClipboard = (text: string) => {
    if (!hasWallets || text === "—") {
      toast.error("Адрес кошелька пока недоступен");
      return;
    }

    navigator.clipboard.writeText(text);
    toast.success(t('walletPage.addressCopied'));
  };

  const handleShare = async () => {
    if (!hasWallets) {
      toast.error("Кошелёк ещё не загружен");
      return;
    }

    const shareData = {
      title: t('walletPage.title'),
      text: t('walletPage.shareMessage', { address: walletAddress }),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(walletAddress);
        toast.success(t('walletPage.copiedToClipboard'));
      }
    } catch {
      // user cancelled share
    }
  };

  const formatBalance = (val: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const shortenAddress = (address: string) =>
    address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address;

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{t('walletPage.title')}</h1>
        </div>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4">
        {cryptoWalletsLoading ? (
          <>
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </>
        ) : !hasWallets ? (
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('walletPage.noWalletsYet', 'У вас пока нет криптокошельков')}
            </p>
            <button
              onClick={() => setOpenWalletDrawer(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t('walletPage.openWallet', 'Открыть кошелёк')}
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="rounded-2xl border border-primary/20 bg-primary/10 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80">
                  <UsdtIcon size={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('walletPage.cryptoWallet')}</p>
                  <p className="text-sm font-medium">{walletToken}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">$</span>
                <span className="text-3xl font-bold">{formatBalance(usdtBalance)}</span>
                <span className="text-lg text-muted-foreground">{walletToken}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate("/top-up/crypto")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  {t('dashboard.topUp')}
                </button>
                <button
                  onClick={() => setSendDrawerOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t('dashboard.send')}
                </button>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <button
                onClick={handleShare}
                disabled={!hasWallets}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 py-3 font-medium text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                {t('walletPage.share')}
              </button>

              <Drawer open={qrOpen} onOpenChange={setQrOpen}>
                <DrawerTrigger asChild>
                  <button
                    disabled={!hasWallets}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 py-3 font-medium text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    {t('walletPage.qrCode')}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="pb-8">
                  <div className="flex flex-col items-center px-6 pt-4 pb-2 space-y-5">
                    <div className="flex items-center gap-2">
                      <UsdtIcon size={20} />
                      <span className="font-semibold">{walletToken} {walletNetwork}</span>
                      {walletNetwork === "TRC20" && <TronIcon size={14} className="opacity-60" />}
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-lg">
                      <QRCodeSVG
                        value={walletAddress}
                        size={220}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">{t('walletPage.walletAddress')}</p>
                      <p className="text-sm font-mono font-medium break-all px-4">{walletAddress}</p>
                    </div>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => copyToClipboard(walletAddress)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-medium text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        {t('walletPage.copy')}
                      </button>
                      <button
                        onClick={() => {
                          setQrOpen(false);
                          handleShare();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary text-foreground py-3 font-medium text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        {t('walletPage.share')}
                      </button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-secondary/50 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Список кошельков</h3>
                <span className="text-xs text-muted-foreground">{cryptoWallets.length}</span>
              </div>
              <div className="space-y-3">
                {cryptoWallets.map((item) => {
                  const isSelected = item.id === wallet?.id;
                  const networkUpper = item.network?.toUpperCase() ?? "";
                  const balance = formatBalance(parseFloat(String(item.balance ?? 0)));
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedWalletId(item.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:bg-accent/50'
                      }`}
                    >
                      {/* Header: network + balance */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getCryptoIcon(item.network?.toLowerCase() ?? '', 20)}
                          <span className="text-sm font-bold text-foreground">{item.token?.toUpperCase()}</span>
                          <span className="text-xs rounded-md bg-muted px-2 py-0.5 text-muted-foreground font-medium">{networkUpper}</span>
                        </div>
                        <span className="text-base font-bold text-foreground">${balance}</span>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border/60 mb-3" />

                      {/* Address */}
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t('walletPage.walletAddress', 'Адрес кошелька')}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-mono text-foreground/70 break-all flex-1 leading-relaxed">{item.address}</p>
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.address);
                            }}
                            className="flex-shrink-0 rounded-lg p-2 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

          </>
        )}

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{t('dashboard.transactions')}</h2>
            <button
              onClick={() => navigate("/Transaction_History")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Clock className="w-4 h-4" />
              {t('card.transactionHistory')}
            </button>
          </div>

          {(transactionsLoading || cryptoApiLoading) ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <CardTransactionsList groups={transactionGroups} walletView />
          )}
        </motion.div>
      </div>

      {/* Send Drawer */}
      <Drawer open={sendDrawerOpen} onOpenChange={setSendDrawerOpen}>
        <DrawerContent className="pb-8">
          <div className="px-6 pt-4 pb-2 space-y-2">
            <h3 className="text-lg font-bold mb-3">{t('dashboard.send')}</h3>

            {/* Send to Card */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/crypto-to-card", { state: { fromWallet: true } }); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('dashboard.sendToCard')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.sendToCardDescription')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Send to USDT Wallet */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/crypto", { state: { fromWallet: true } }); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('drawer.usdtBalance', 'Перевод на Кошелёк USDT')}</p>
                  <p className="text-xs text-muted-foreground">{t('drawer.usdtBalanceDesc', 'Перевод USDT на Кошелек EasyCard так и внешний')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Send to Bank Account */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/bank", { state: { fromWallet: true } }); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5B6EF5] flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('drawer.bankTransfer', 'Перевод на счёт')}</p>
                  <p className="text-xs text-muted-foreground">{t('send.sendLocalBankTransfer', 'Перевод на банковский счет (IBAN)')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Open Wallet Drawer */}
      <Drawer open={openWalletDrawer} onOpenChange={(open) => {
        setOpenWalletDrawer(open);
        if (!open) {
          setWalletStep('token');
          setCreateError(null);
        }
      }}>
        <DrawerContent className="pb-8">
          <div className="px-6 pt-4 pb-2 space-y-5">
            {walletStep === 'token' && (
              <>
                <h3 className="text-lg font-bold">{t('walletPage.selectToken', 'Выберите монету')}</h3>
                <div className="space-y-2">
                  {TOKENS_LIST.map((tk) => (
                    <button
                      key={tk.id}
                      onClick={() => {
                        setNewToken(tk.id);
                        setWalletStep('network');
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tk.color }}
                      >
                        <span className="text-white text-base font-bold">{tk.symbol}</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-sm">{tk.id}</p>
                        <p className="text-xs text-muted-foreground">{tk.name}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {walletStep === 'network' && (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWalletStep('token')} className="p-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold">
                    {t('walletPage.selectNetwork', 'Выберите сеть')} — {newToken}
                  </h3>
                </div>
                <div className="space-y-2">
                  {NETWORKS_LIST.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => setNewNetwork(net.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                        newNetwork === net.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      {getCryptoIcon(net.id, 24)}
                      <span className="font-medium text-sm">{net.name}</span>
                    </button>
                  ))}
                </div>

                {createError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 space-y-1">
                    <p className="text-sm text-destructive font-semibold">⚠️ Не удалось создать кошелёк</p>
                    <details className="mt-1">
                      <summary className="text-[11px] text-muted-foreground cursor-pointer select-none">
                        Системная информация
                      </summary>
                      <div className="mt-1 bg-muted/50 rounded-lg px-3 py-2 text-[11px] text-muted-foreground font-mono break-all space-y-0.5">
                        <p>API: POST /transactions/topup/crypto/</p>
                        <p>Error: {createError}</p>
                      </div>
                    </details>
                  </div>
                )}

                <button
                  onClick={async () => {
                    setCreating(true);
                    setCreateError(null);
                    try {
                      const result = await registerCryptoWallets();
                      if (result.success) {
                        queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });
                        setWalletStep('success');
                      } else {
                        setCreateError(result.error || 'Unknown error');
                      }
                    } catch (err: any) {
                      setCreateError(err?.message || 'Network error');
                    } finally {
                      setCreating(false);
                    }
                  }}
                  disabled={creating}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-opacity hover:opacity-90 active:scale-[0.98]"
                >
                  {creating ? t('common.loading', 'Загрузка...') : t('walletPage.addWallet', 'Добавить')}
                </button>
              </>
            )}

            {walletStep === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-4 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="text-lg font-bold text-center">
                  {t('walletPage.walletCreatedTitle', 'Поздравляем!')}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t('walletPage.walletCreatedDesc', 'Ваш кошелёк {{token}} ({{network}}) успешно создан')
                    .replace('{{token}}', newToken)
                    .replace('{{network}}', newNetwork.toUpperCase())}
                </p>
                <button
                  onClick={async () => {
                    await queryClient.refetchQueries({ queryKey: ['crypto-wallets'] });
                    setOpenWalletDrawer(false);
                    setWalletStep('token');
                  }}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
                >
                  {t('walletPage.goToWallet', 'Перейти к кошельку')}
                </button>
              </motion.div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

export default WalletPage;
