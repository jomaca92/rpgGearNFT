import React, { useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from 'ethers'
import rpgGear from './utils/rpgGear.json'

// Constants
const CONTRACT_ADDRESS = "0xb06621eFCf914fee8595ac7BCf8DF06B4F6a4b0E"
const TWITTER_HANDLE = 'jonah_sc';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 50;
const OPENSEA_URL = `https://testnets.opensea.io/collection/rpggear-v3`
const RARIBLE_URL = `https://rinkeby.rarible.com/token/${CONTRACT_ADDRESS}:`
const EST_GAS = 3500000

const App = () => {

  const [currentAccount, setCurrentAccount] = useState("")
  const [minting, setMinting] = useState(false)
  const [lastMinted, setLastMinted] = useState([])
  const [mintAmount, setMintAmount] = useState(1)
  const [maxSupply, setMaxSupply] = useState(0)
  const [totalMinted, setTotalMinted] = useState(0)

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    let chainId = await ethereum.request({method: "eth_chainId"})
    console.log("Connected to chain " + chainId)
    
    const rinkebyChainId = "0x4"
    if (chainId !== rinkebyChainId)
      alert("You are not connected to the Rinkeby Test Network!")

    const accounts = await ethereum.request({method: 'eth_accounts'})

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
      setupEventListener()
      getMintInfo()
    } else {
      console.log("No authorized account found")
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Get metamask!")
        return
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"})
      console.log("connected" , accounts[0])
      setCurrentAccount(accounts[0])
      setupEventListener()
      getMintInfo()
    } catch (error) {
      console.log(error)
    }
  }

  const getMintInfo = async() => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Get metamask!")
        return
      }

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, rpgGear.abi, signer)

      let supply = await connectedContract.getMaxSupply()
      let minted = await connectedContract.getTotalMinted()

      setMaxSupply(supply.toNumber())
      setTotalMinted(minted.toNumber())

    } catch (error) {
      console.log(error)
    }
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Get metamask!")
        return
      }

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, rpgGear.abi, signer)

      connectedContract.on("NewMint", (from, tokenIds) => {
        setLastMinted(tokenIds)
        getMintInfo()
      })

      console.log("Setup event listener!")

    } catch (error) {
      console.log(error)
    }
  }

  const mintNFT = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Get metamask!")
        return
      }
      if (mintAmount < 1 || mintAmount > 5) {
        alert("Invalid mint amount, must be between 1-5")
        return
      }

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, rpgGear.abi, signer)

      console.log("Going to pop wallet now to pay gas...")
      setMinting(true)
      let nftTxn = await connectedContract.mint(mintAmount, { gasLimit: EST_GAS * mintAmount});

      console.log("Mining...please wait.")
      await nftTxn.wait();
      setMinting(false)

      console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

    } catch (error) {
      console.log(error)
      setMinting(false)
      alert(error.message)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button mb-2">
      Connect to Wallet
    </button>
  );

  const renderMintButton = () => (
    <button onClick={mintNFT} className="cta-button mint-button mb-2">
      Mint!
    </button>
  )

  const renderMinting = () => (
    <div className="d-flex text-white text-sm">
      <div className="mr-2">Minting</div>
      <div className="loader"></div>
    </div>
  )

  const renderMinted = () => (
      <div>
        <p className="text-white">Minting Complete!</p>
        { lastMinted.map( tokenId => (
          <p key={tokenId.toNumber()}>👉 <a className="link" target="_blank" href={ RARIBLE_URL + tokenId.toNumber() }> View token id #{tokenId.toNumber()} on Rarible</a></p>
          )
        )}
      </div>
  )

  useEffect( () => {
    checkIfWalletIsConnected()
  }, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">rpgGear NFT</p>
          <p className="sub-text">
            Each piece of adventurer gear is randomly generated on chain.
          </p>
          
        </div>
        <div className="body-container flex-column">
          <div className="body-card">
            <div className="d-flex flex-column">
              <div className="d-flex align-items-end mb-5">
                <p className="gradient-text mint-count mr-2" style={{"marginTop":0, "marginBottom":0}}>{totalMinted}/{maxSupply}</p> 
                <p className="text-white" style={{"marginTop":0, "marginBottom":"5px"}}>
                  Minted
                </p>
              </div>
              <div className="d-flex flex-column">
                <label className="text-white mb-2"> Amount to Mint: <input type="number"  min="1" max="5" value={mintAmount} onChange={e => setMintAmount(e.target.value)} /></label>
                
                {currentAccount == "" ? renderNotConnectedContainer() : renderMintButton()}
                {minting && renderMinting()}
                {lastMinted.length > 0 && renderMinted()}
              </div>
            </div>
            <p>
              <a className="link" target="_blank" href={ OPENSEA_URL }>🌊 View on OpenSea</a>
            </p>
          </div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;