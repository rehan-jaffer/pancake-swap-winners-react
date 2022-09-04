import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import Web3 from 'web3'
import Contract from 'web3-eth-contract'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween.js'
import "./bootstrap.min.css";
import "./styles.css"

dayjs.extend(isBetween)

const PARTNER_ID = "0x0002000000000000000000000000000000000000000000000000000000000000"

const START_DATE = "2022-08-23"
const END_DATE = "2022-09-06";

const WIDGET_EVENT = "WidgetSwapped"

const WIDGET_ABI_JSON = [{ "inputs": [{ "internalType": "address", "name": "_stargateRouter", "type": "address" }, { "internalType": "address", "name": "_stargateRouterETH", "type": "address" }, { "internalType": "address", "name": "_stargateFactory", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes2", "name": "partnerId", "type": "bytes2" }], "name": "PartnerSwap", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes2", "name": "partnerId", "type": "bytes2" }, { "indexed": false, "internalType": "uint256", "name": "tenthBps", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "widgetFee", "type": "uint256" }], "name": "WidgetSwapped", "type": "event" }, { "inputs": [], "name": "MAX_UINT", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "TENTH_BPS_DENOMINATOR", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes2", "name": "_partnerId", "type": "bytes2" }], "name": "partnerSwap", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "stargateFactory", "outputs": [{ "internalType": "contract IStargateFactory", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "stargateRouter", "outputs": [{ "internalType": "contract IStargateRouter", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "stargateRouterETH", "outputs": [{ "internalType": "contract IStargateRouterETH", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "_dstChainId", "type": "uint16" }, { "internalType": "uint256", "name": "_amountLD", "type": "uint256" }, { "internalType": "uint256", "name": "_minAmountLD", "type": "uint256" }, { "internalType": "bytes", "name": "_to", "type": "bytes" }, { "internalType": "bytes2", "name": "_partnerId", "type": "bytes2" }, { "components": [{ "internalType": "uint256", "name": "tenthBps", "type": "uint256" }, { "internalType": "address", "name": "feeCollector", "type": "address" }], "internalType": "struct IStargateWidget.FeeObj", "name": "_feeObj", "type": "tuple" }], "name": "swapETH", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "_dstChainId", "type": "uint16" }, { "internalType": "uint16", "name": "_srcPoolId", "type": "uint16" }, { "internalType": "uint16", "name": "_dstPoolId", "type": "uint16" }, { "internalType": "uint256", "name": "_amountLD", "type": "uint256" }, { "internalType": "uint256", "name": "_minAmountLD", "type": "uint256" }, { "components": [{ "internalType": "uint256", "name": "dstGasForCall", "type": "uint256" }, { "internalType": "uint256", "name": "dstNativeAmount", "type": "uint256" }, { "internalType": "bytes", "name": "dstNativeAddr", "type": "bytes" }], "internalType": "struct IStargateRouter.lzTxObj", "name": "_lzTxParams", "type": "tuple" }, { "internalType": "bytes", "name": "_to", "type": "bytes" }, { "internalType": "bytes2", "name": "_partnerId", "type": "bytes2" }, { "components": [{ "internalType": "uint256", "name": "tenthBps", "type": "uint256" }, { "internalType": "address", "name": "feeCollector", "type": "address" }], "internalType": "struct IStargateWidget.FeeObj", "name": "_feeObj", "type": "tuple" }], "name": "swapTokens", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "tokenApproved", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }];

const POLYGON_ONE_MONTH_BLOCK_TIME = 525913

const explorerURLs = {
  "Ethereum": "https://etherscan.io/tx/",
  "Polygon": "https://polygonscan.com/tx/",
  "Optimism": "https://optimistic.etherscan.io/tx/",
  "Fantom": "https://ftmscan.com/tx/",
  "Avalanche": "https://avascan.info/blockchain/c/tx/",
  "BNB Chain": "https://bscscan.com/tx/",
  "Arbitrum": "https://arbiscan.io/tx/"
}

const endpoints = {
  "Polygon": { address: "0xdc2716B92480225533aBC3328C2Ab961f2A9247d", rpc: "https://rpc.ankr.com/polygon/f46966197a455369c256a16d025fcef3f432951cca2a604dee244ffe0f9c40a9", fromZero: false },
  "Arbitrum": { address: "0x6c33A7b29C8B012D060F3a5046f3ee5aC48f4780", rpc: "https://arbitrum-mainnet.infura.io/v3/79b705a25830477b82fe9d8c8eb1f252" },
  "Optimism": { address: "0x46Bc16F76B0aE14Abb820D3410843Ba54D8ef6f0", rpc: "https://rpc.ankr.com/optimism/f46966197a455369c256a16d025fcef3f432951cca2a604dee244ffe0f9c40a9" },
  "Fantom": { address: "0xC8e5157EC44E00ff85Bf15D4f50974d3A8166427", rpc: "https://rpc.ftm.tools/" },
  "Ethereum": { address: "0x76d4d68966728894961AA3DDC1d5B0e45668a5A6", rpc: "https://mainnet.infura.io/v3/79b705a25830477b82fe9d8c8eb1f252" },
  "BNB Chain": { address: "0x2Eb9ea9dF49BeBB97e7750f231A32129a89b82ee", rpc: "https://rpc.ankr.com/bsc/f46966197a455369c256a16d025fcef3f432951cca2a604dee244ffe0f9c40a9", fromZero: false, fromBlock: 20923544 },
  "Avalanche": { address: "0x20293eDD4f52F81234b3997B9AE4742c48005858", rpc: "https://rpc.ankr.com/avalanche" }
}

const getBlockToStartFrom = (endpoint, currentBlock) => {
  if ((endpoint.fromZero) !== false) {
    return { fromBlock: 0x0 };
  } else {
    return (endpoint.hasOwnProperty("fromBlock")) ?
      { fromBlock: endpoint.fromBlock } : { fromBlock: currentBlock - POLYGON_ONE_MONTH_BLOCK_TIME };
  }  
}

function App() {

  const [chains, setChains] = useState(Object.fromEntries(Object.keys(endpoints).map((key) => [key, "Waiting"])))
  const [consoleText, setConsoleText] = useState([])
  const [winners, setWinners] = useState([])

  const logToScreen = (line) => setConsoleText((consoleText) => [...consoleText, line])

  useEffect(() => {

    const selectRandomAccounts = (accountsArray) => {

      // randomizer, sort Array in a totally random order and return first 100 addresses
      const shuffled = accountsArray.sort((a, b) => 0.5 - Math.random()).slice(0, 100);
      console.log("Listing 100 random accounts..")

      shuffled.forEach((entry) => {
        setWinners((winners) => [...winners, entry])
      });
    }

    const collateData = (events) => {

      const accounts = {}
      const accountsArray = []

      events.forEach((e) => {
        e.forEach((e2) => {
          if (!(e2.chain in accounts)) {
            accounts[e2.chain] = [];
          }
          accounts[e2.chain].push([e2.from, e2.hash, e2.ts.format('DD/MM/YYYY')])
          accountsArray.push(e2.from)
        })
      });

      return [accounts, accountsArray];
    }

    const sanityCheckOutput = (accounts) => {

      const numberOfChains = Object.keys(accounts).length;

      logToScreen("[*] Running sanity check")
      logToScreen(`${numberOfChains} chains..`)

      Object.keys(accounts).forEach((key) => {
        logToScreen(`* Found ${accounts[key].length} transfers from ${key}...`)
      });

      Object.keys(accounts).forEach((chain) => {
        accounts[chain].forEach((account) => {
          let link = (chain in explorerURLs) ? `<a class="tx-link" href ='${explorerURLs[chain] + account[1]}'>${account[1]}</a>` : account[1];
          logToScreen(`[${chain}] ${account[2]} ACCOUNT: ${account[0]} TX: ${link}`)
        });
      });
    }


    async function getEventsForChain(endpoint_key) {

      const endpoint = endpoints[endpoint_key]

      try {

        Contract.setProvider(endpoint.rpc)

        const web3 = new Web3(endpoint.rpc)
        const contract = new Contract(WIDGET_ABI_JSON, endpoint.address)
        logToScreen(`[${endpoint_key}] Connecting to ${endpoint_key} on ${endpoints[endpoint_key].rpc}...`)

        const currentBlock = await web3.eth.getBlockNumber();

        const events = await contract.getPastEvents(WIDGET_EVENT, getBlockToStartFrom(endpoints[endpoint_key], currentBlock))
        logToScreen(`[${endpoint_key}] Querying widget contract ${endpoints[endpoint_key].address}...`)

        setChains((chains) => { return { ...chains, [endpoint_key]: "Connected!" } })

        const events_filtered_by_partner_id = events.filter((r) => r.returnValues.partnerId == PARTNER_ID)

        const results = await Promise.all(events_filtered_by_partner_id.map(async (transaction) => {
          // fetch transactions for events to grab blockHash, account address and timestamp

          const tx = await web3.eth.getTransaction(transaction.transactionHash)
          tx.chain = endpoint_key; // save the chain this is from, some chains don't include chainId

          const block = await web3.eth.getBlock(tx.blockHash);
          const ts = dayjs.unix(block.timestamp);
          tx.ts = ts;

          // 3rd param [) means inclusive of start date but not end date

          return (ts.isBetween(START_DATE, END_DATE, 'day', "[)") === true) ? tx : null
        }));

        return results.filter((res) => res !== null);

      } catch (e) {
        setChains((chains) => { return { ...chains, [endpoint_key]: `Error: ${e}` } })
        return []
      }

    }


    Promise.all(Object.keys(endpoints).map((endpoint_key) => getEventsForChain(endpoint_key))).then((allEvents) => {
      const [accounts, accountsArray] = collateData(allEvents)
      sanityCheckOutput(accounts)
      selectRandomAccounts(accountsArray)
    })

  }, [])

  return (
    <div className="App container-fluid">
      <div className="row">
        <ul className="chain-status col-3">
          <strong>RPC Connections:</strong>
          {Object.keys(chains).map((chain_key) => (<li className="chain">
            <div className="chain-name-div">{chain_key}</div> <div className="chain-status-div">{chains[chain_key]}</div></li>))}
        </ul>
        <div className="console col-5">
          <strong>Debugger: </strong>
          <ul className="console-lines">
            {consoleText.map((line) => (<li className="console-line"><div dangerouslySetInnerHTML={{ __html: line }} /></li>))}
          </ul>
        </div>
        <div className="col-4 winners-container">
          <strong>Winners will appear here: </strong>
          <ul className="winners-list">
            {winners.map((winner) => (<li className="winner-item">{winner}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
