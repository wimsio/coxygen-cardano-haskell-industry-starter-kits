import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ArrowRight, Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';

const features = [
  {
    icon: Shield,
    title: 'Trustless Security',
    description: 'Smart contracts enforce rules automatically. No third-party control over your funds.',
  },
  {
    icon: Lock,
    title: 'Funds Protected',
    description: 'ADA is locked in a script address until conditions are met. Complete transparency.',
  },
  {
    icon: Zap,
    title: 'Fast Settlement',
    description: 'Release funds instantly when both parties agree. Automatic refunds on expiry.',
  },
];

const steps = [
  { number: '01', title: 'Create Escrow', description: 'Buyer locks ADA with seller address and deadline' },
  { number: '02', title: 'Await Delivery', description: 'Seller fulfills agreement while funds are secured' },
  { number: '03', title: 'Release or Refund', description: 'Buyer releases payment or claims refund after deadline' },
];

export const Landing: React.FC = () => {
  const { wallet } = useWallet();
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Cardano Plutus V2 Smart Contracts</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Trustless Escrow</span>
            <br />
            <span className="text-foreground">for the Cardano Ecosystem</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Secure peer-to-peer transactions with smart contract protection. 
            Lock funds, set conditions, and let the blockchain enforce the rules.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {wallet ? (
              <Link to="/dashboard">
                <Button size="lg" className="btn-gradient gap-2 text-lg px-8">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={() => setConnectModalOpen(true)}
                className="btn-gradient gap-2 text-lg px-8"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </Button>
            )}
          </div>
        </motion.div>

        {/* Animated Cards Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          <div className="glass-card-glow p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { status: 'Active', amount: '500 ₳', seller: 'addr1...x7k2' },
                { status: 'Completed', amount: '1,200 ₳', seller: 'addr1...m3n9' },
                { status: 'Pending', amount: '750 ₳', seller: 'addr1...p4q8' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass-card p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Active' ? 'status-active' :
                      item.status === 'Completed' ? 'status-completed' : 'status-pending'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold gradient-text mb-1">{item.amount}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.seller}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">Cardano Escrow</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built on Cardano's eUTxO model with Plutus smart contracts for maximum security and efficiency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 group hover:border-primary/50 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to secure your transactions on the Cardano blockchain.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="flex items-start gap-6 mb-8"
            >
              <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
              </div>
              <div className="glass-card p-6 flex-1">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          {wallet ? (
            <Link to="/create">
              <Button size="lg" className="btn-gradient gap-2">
                <CheckCircle className="h-5 w-5" />
                Create Your First Escrow
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={() => setConnectModalOpen(true)}
              className="btn-gradient gap-2"
            >
              <Wallet className="h-5 w-5" />
              Get Started
            </Button>
          )}
        </motion.div>
      </section>

      <WalletConnectModal open={connectModalOpen} onOpenChange={setConnectModalOpen} />
    </div>
  );
};

export default Landing;
