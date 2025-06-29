
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Link as LinkIcon, Shield, AlertCircle } from 'lucide-react';
import { walletUtils, contractUtils, ipfsUtils } from '@/lib/blockchain';

/**
 * Blockchain integration placeholder component
 * This component demonstrates the future blockchain features
 * TODO: Replace with actual Wagmi implementation
 */
const BlockchainPlaceholder = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await walletUtils.connectMetaMask();
      if (result.address) {
        setWalletAddress(result.address);
      } else {
        console.error('Wallet connection failed:', result.error);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    await walletUtils.disconnectWallet();
    setWalletAddress(null);
  };

  const handleTestBlockchainMessage = async () => {
    if (!walletAddress) return;
    
    try {
      const txHash = await contractUtils.sendMessageToChain(
        '0x0987654321098765432109876543210987654321',
        'test-content-hash'
      );
      setLastTxHash(txHash);
    } catch (error) {
      console.error('Error sending blockchain message:', error);
    }
  };

  const handleTestIPFS = async () => {
    try {
      const ipfsHash = await ipfsUtils.storeOnIPFS('Test encrypted message content');
      console.log('IPFS Hash:', ipfsHash);
      
      if (ipfsHash) {
        const retrievedContent = await ipfsUtils.getFromIPFS(ipfsHash);
        console.log('Retrieved from IPFS:', retrievedContent);
      }
    } catch (error) {
      console.error('Error with IPFS:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Blockchain Integration (Preview)
          </CardTitle>
          <div className="flex items-center text-sm text-yellow-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            These features are placeholders for future blockchain integration
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Connection */}
          <div className="space-y-3">
            <h4 className="font-medium">Wallet Connection</h4>
            {walletAddress ? (
              <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                <div>
                  <p className="text-sm text-green-300">Connected to MetaMask</p>
                  <p className="text-xs text-white/70 font-mono">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </p>
                </div>
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  size="sm"
                  className="border-red-400/30 text-red-300 hover:bg-red-500/20"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </Button>
            )}
          </div>

          {/* Smart Contract Features */}
          <div className="space-y-3">
            <h4 className="font-medium">Smart Contract Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleTestBlockchainMessage}
                disabled={!walletAddress}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Send Message to Chain
              </Button>
              <Button
                onClick={handleTestIPFS}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Test IPFS Storage
              </Button>
            </div>
          </div>

          {/* Transaction Status */}
          {lastTxHash && (
            <div className="space-y-3">
              <h4 className="font-medium">Last Transaction</h4>
              <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <p className="text-sm text-blue-300">Transaction Hash:</p>
                <p className="text-xs text-white/70 font-mono break-all">{lastTxHash}</p>
                <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-400/30">
                  Confirmed
                </Badge>
              </div>
            </div>
          )}

          {/* Future Features */}
          <div className="space-y-3">
            <h4 className="font-medium">Planned Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Badge variant="outline" className="justify-center border-white/30 text-white/70">
                Message Verification
              </Badge>
              <Badge variant="outline" className="justify-center border-white/30 text-white/70">
                Decentralized Storage
              </Badge>
              <Badge variant="outline" className="justify-center border-white/30 text-white/70">
                Token Rewards
              </Badge>
              <Badge variant="outline" className="justify-center border-white/30 text-white/70">
                DAO Governance
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Blockchain Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <h5 className="font-medium mb-2">Smart Contracts</h5>
              <p className="text-sm text-white/70">Ethereum-based contracts for message verification and user management</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <h5 className="font-medium mb-2">IPFS Storage</h5>
              <p className="text-sm text-white/70">Decentralized storage for encrypted message content</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <h5 className="font-medium mb-2">Wallet Integration</h5>
              <p className="text-sm text-white/70">MetaMask and WalletConnect support via Wagmi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainPlaceholder;
