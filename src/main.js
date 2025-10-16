import { auth } from './lib/auth.js';
import { blockchainAPI } from './lib/supabase.js';

let isSignUp = false;

function initAuth() {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const authButtons = document.getElementById('authButtons');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const toggleAuth = document.getElementById('toggleAuth');

  auth.subscribe((user) => {
    if (user) {
      authSection.style.display = 'none';
      mainContent.style.display = 'block';
      authButtons.innerHTML = `
        <span style="color: var(--text-muted);">${user.email}</span>
        <button class="btn btn-secondary" id="signOutBtn">Sign Out</button>
      `;

      document.getElementById('signOutBtn').addEventListener('click', async () => {
        await auth.signOut();
      });

      loadDashboard();
    } else {
      authSection.style.display = 'block';
      mainContent.style.display = 'none';
      authButtons.innerHTML = '';
    }
  });

  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    authTitle.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    authForm.querySelector('button[type="submit"]').textContent = isSignUp ? 'Sign Up' : 'Sign In';
    toggleAuth.textContent = isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up";
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      if (isSignUp) {
        await auth.signUp(email, password);
        alert('Sign up successful! Please sign in.');
        isSignUp = false;
        authTitle.textContent = 'Sign In';
        authForm.querySelector('button[type="submit"]').textContent = 'Sign In';
        toggleAuth.textContent = "Don't have an account? Sign Up";
      } else {
        await auth.signIn(email, password);
      }
      authForm.reset();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'blocks') {
        loadBlocks();
      } else if (targetTab === 'transactions') {
        loadTransactions();
      } else if (targetTab === 'wallet') {
        loadWallets();
      }
    });
  });
}

async function loadDashboard() {
  try {
    const [blocks, transactions, wallets] = await Promise.all([
      blockchainAPI.getBlocks(5),
      blockchainAPI.getTransactions(),
      blockchainAPI.getWallets()
    ]);

    document.getElementById('totalBlocks').textContent = blocks.length > 0 ? blocks[0].block_number : 0;
    document.getElementById('totalTransactions').textContent = transactions.length;
    document.getElementById('totalWallets').textContent = wallets.length;

    const recentBlocksContainer = document.getElementById('recentBlocks');
    if (blocks.length === 0) {
      recentBlocksContainer.innerHTML = '<div class="empty-state">No blocks found</div>';
    } else {
      recentBlocksContainer.innerHTML = blocks.map(block => `
        <div class="block-item">
          <h4>Block #${block.block_number}</h4>
          <p><strong>Hash:</strong> <span class="hash">${block.hash}</span></p>
          <p><strong>Previous Hash:</strong> <span class="hash">${block.previous_hash.substring(0, 16)}...</span></p>
          <p><strong>Timestamp:</strong> ${new Date(block.timestamp).toLocaleString()}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadBlocks() {
  try {
    const blocks = await blockchainAPI.getBlocks(20);
    const blocksContainer = document.getElementById('blocksList');

    if (blocks.length === 0) {
      blocksContainer.innerHTML = '<div class="empty-state">No blocks found</div>';
    } else {
      blocksContainer.innerHTML = blocks.map(block => `
        <div class="block-item">
          <h4>Block #${block.block_number}</h4>
          <p><strong>Hash:</strong> <span class="hash">${block.hash}</span></p>
          <p><strong>Previous Hash:</strong> <span class="hash">${block.previous_hash}</span></p>
          <p><strong>Nonce:</strong> ${block.nonce}</p>
          <p><strong>Timestamp:</strong> ${new Date(block.timestamp).toLocaleString()}</p>
          <p><strong>Data:</strong> ${JSON.stringify(block.data)}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading blocks:', error);
  }
}

async function loadTransactions() {
  try {
    const transactions = await blockchainAPI.getTransactions();
    const transactionsContainer = document.getElementById('transactionsList');

    if (transactions.length === 0) {
      transactionsContainer.innerHTML = '<div class="empty-state">No transactions found</div>';
    } else {
      transactionsContainer.innerHTML = transactions.map(tx => `
        <div class="transaction-item">
          <h4>Transaction</h4>
          <p><strong>Hash:</strong> <span class="hash">${tx.tx_hash}</span></p>
          <p><strong>From:</strong> <span class="hash">${tx.from_address}</span></p>
          <p><strong>To:</strong> <span class="hash">${tx.to_address}</span></p>
          <p><strong>Amount:</strong> ${tx.amount}</p>
          <p><strong>Fee:</strong> ${tx.fee}</p>
          <p><strong>Status:</strong> <span style="color: ${tx.status === 'confirmed' ? 'var(--success)' : 'var(--primary)'}">${tx.status}</span></p>
          <p><strong>Created:</strong> ${new Date(tx.created_at).toLocaleString()}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

async function loadWallets() {
  try {
    const wallets = await blockchainAPI.getWallets();
    const walletsContainer = document.getElementById('walletsList');

    if (wallets.length === 0) {
      walletsContainer.innerHTML = '<div class="empty-state">No wallets created yet. Click the button above to create your first wallet.</div>';
    } else {
      walletsContainer.innerHTML = wallets.map(wallet => `
        <div class="wallet-item">
          <h4>Wallet</h4>
          <p><strong>Address:</strong> <span class="hash">${wallet.address}</span></p>
          <p><strong>Balance:</strong> ${wallet.balance}</p>
          <p><strong>Created:</strong> ${new Date(wallet.created_at).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(wallet.updated_at).toLocaleString()}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading wallets:', error);
  }
}

function initWalletActions() {
  const createWalletBtn = document.getElementById('createWalletBtn');

  createWalletBtn.addEventListener('click', async () => {
    try {
      createWalletBtn.disabled = true;
      createWalletBtn.textContent = 'Creating...';

      await blockchainAPI.createWallet();
      await loadWallets();

      createWalletBtn.disabled = false;
      createWalletBtn.textContent = 'Create New Wallet';

      alert('Wallet created successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
      createWalletBtn.disabled = false;
      createWalletBtn.textContent = 'Create New Wallet';
    }
  });
}

initAuth();
initTabs();
initWalletActions();
