
# Affiliate Marketing Chat DApp

A comprehensive web application for affiliate marketing publishers to collaborate via real-time chat and query campaign/academy information using a RAG-based chatbot.

## 🚀 Features

- **Real-time Chat**: Group chats (up to 10 participants) and private 1:1 messaging
- **AI Assistant**: RAG-powered chatbot for querying campaign and academy data
- **User Authentication**: Email and OAuth (Google) authentication via Supabase
- **Responsive Design**: Modern UI with Tailwind CSS, optimized for desktop and mobile
- **Blockchain Ready**: Architecture prepared for future Ethereum integration

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Lucide React** for icons

### Backend (To be implemented with Supabase)
- **Supabase** for authentication, database, and Edge Functions
- **PostgreSQL** for data storage
- **Row Level Security (RLS)** for data protection

### Future Blockchain Integration
- **Ethereum** blockchain support
- **Wagmi** for wallet connections
- **Hardhat** for smart contract development
- **IPFS** for decentralized storage

## 📋 Database Schema (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id), -- NULL for group messages
  group_id VARCHAR(50), -- Group identifier
  content TEXT NOT NULL,
  content_hash VARCHAR(64), -- For future blockchain verification
  timestamp TIMESTAMP DEFAULT NOW(),
  encrypted BOOLEAN DEFAULT FALSE
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  commission_rate VARCHAR(10),
  performance_metrics JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Academy table
CREATE TABLE academy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  url VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for backend functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd affiliate-marketing-chat-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

## 🔧 Supabase Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy your project URL and anon key

### 2. Database Schema
Run the SQL commands from the Database Schema section in your Supabase SQL editor.

### 3. Authentication Setup
- Enable Email authentication in Supabase Auth settings
- Configure Google OAuth provider (optional)

### 4. Row Level Security (RLS)
```sql
-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages they sent or received
CREATE POLICY "Users can read own messages" ON messages
FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Policy: Users can insert messages
CREATE POLICY "Users can insert messages" ON messages
FOR INSERT WITH CHECK (sender_id = auth.uid());
```

### 5. Edge Functions (TODO)
Create Edge Functions for:
- `send-message`: Handle message encryption and storage
- `query-campaign`: RAG queries for campaign data
- `query-academy`: RAG queries for academy resources

## 🤖 RAG Implementation

The current implementation includes a mock RAG system. For production:

1. **Vector Database**: Use Supabase with pgvector extension
2. **Embeddings**: Integrate with OpenAI embeddings API
3. **Knowledge Base**: Populate with campaign and academy data
4. **Query Processing**: Implement semantic search and response generation

## 🔗 Blockchain Integration (Future)

### Prerequisites for Blockchain Features
```bash
# Install blockchain development tools
npm install --save-dev hardhat
npm install wagmi ethers @web3modal/react
npm install ipfs-http-client crypto-js
```

### Smart Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChatContract {
    struct Message {
        address sender;
        address recipient;
        uint256 timestamp;
        bytes32 contentHash;
    }
    
    Message[] public messages;
    
    function sendMessage(address _recipient, bytes32 _contentHash) public {
        messages.push(Message(msg.sender, _recipient, block.timestamp, _contentHash));
    }
    
    function getMessageCount() public view returns (uint256) {
        return messages.length;
    }
}
```

### Hardhat Configuration
```javascript
// hardhat.config.js
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.alchemyapi.io/v2/YOUR_API_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

### Wagmi Integration (Frontend)
```typescript
// Future wallet connection component
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });
  const { disconnect } = useDisconnect();

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
};
```

## 🔐 Security Features

- **Client-side Encryption**: Messages encrypted with crypto-js before storage
- **Row Level Security**: Supabase RLS policies protect data access
- **Input Validation**: All user inputs validated in Edge Functions
- **Authentication**: Secure user authentication via Supabase

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interfaces
- Optimized performance on all devices

## 🚀 Deployment

### Via Lovable.dev
1. Use Lovable's built-in deployment feature
2. Get shareable URL automatically

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy to your preferred hosting platform
# (Vercel, Netlify, etc.)
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run security scan
# Use Lovable.dev's built-in security scan feature
```

## 📈 Performance Requirements

- **Chat Latency**: < 3 seconds for message delivery
- **RAG Queries**: < 2 seconds for response time
- **Concurrent Users**: Supports up to 100 users
- **Uptime**: 99.9% availability target

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

---

## 🔮 Future Roadmap

- [ ] Implement Supabase integration
- [ ] Add real-time subscriptions
- [ ] Implement production RAG system
- [ ] Add blockchain features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

**Note**: This is an MVP version with mock data. Supabase integration and blockchain features are planned for future releases.
