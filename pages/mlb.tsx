// pages/nba.tsx
import styles from '../styles/ncaab.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// Define your data types for matchups and logos
type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
};

type AdjMatchData = {
  Team1: string;
  Team2: string;
  Total: number;
  team1_offense_b: number;
  team2_offense_b: number;
  AdjTotal: number;
  Difference: number;
};

type LogoUrls = { [team: string]: string };

type TallyData = {
    "2+": string,
    "1_to_2": string,
    "0.5_to_1": string,
    "-0.5_to_0.5": string,
    "-1_to_-2": string,
    "-2-": string
};

const MLB = () => {
    const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
    // State for the logos and matchups for the sideNav
    const [logos, setLogos] = useState<LogoUrls>({});
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [matchups, setMatchups] = useState<Matchup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tableMarginTop, setTableMarginTop] = useState(0);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
    const [tallies, setTallies] = useState<TallyData>({
        "2+": "Loading...",
        "1_to_2": "Loading...",
        "0.5_to_1": "Loading...",
        "-0.5_to_0.5": "Loading...",
        "-1_to_-2": "Loading...",
        "-2-": "Loading..."
    });
  useEffect(() => {
    // Fetch the logos and matchups
// Fetch the logos and matchups
Promise.all([
    fetch('/mlblogos.json').then(res => res.json()),
    fetch('/mlbmatchups.json').then(res => res.json()),
    fetch('/mlbordered.json').then(res => res.json()),
    fetch('/cumulative_tallies.json').then(res => res.json())
])
.then(([logosData, matchupsData, adjMatchOrderData, tallyData]) => { // <- Include tallyData here
    setLogos(logosData);
    setMatchups(matchupsData);
    setAdjMatchData(adjMatchOrderData);
    setTallies(tallyData); // <- Now tallyData is correctly passed in 
})
.catch(error => {
    console.error('Error fetching data:', error);
    // If there's an error fetching tallies, you may want to set a default message or value
    setTallies({
        "2+": "Error",
        "1_to_2": "Error",
        "0.5_to_1": "Error",
        "-0.5_to_0.5": "Error",
        "-1_to_-2": "Error",
        "-2-": "Error"
    });
})
.finally(() => {
    setIsLoading(false);
});

    }, []);

    useEffect(() => {
      if (contentRef.current) {
        const contentBottom = contentRef.current.getBoundingClientRect().bottom;
        const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0;
        let newMarginTop;
    
        if (adjMatchData.length === 0) {
          // When there's no data, center the table on the screen
          newMarginTop = (window.innerHeight - contentBottom) / 2;
        } else {
          // When there's data, set a smaller margin
          newMarginTop = 20; // Or any other suitable value based on your design
        }
    
        setTableMarginTop(Math.max(newMarginTop, 20)); // Ensures that the margin is not less than 20px
      }
    }, [adjMatchData]);

    function toFixed(value: number | undefined, decimals: number = 1): string {
      // Check if the value is a number and is not null or undefined.
        if (typeof value === 'number') {
            return value.toFixed(decimals);
        } else {
            // Return 'N/A' if the value is not a number.
            return 'N/A';
      }
    }

  if (isLoading) {
    return <div>Loading...</div>; // Render a loading state or spinner here
  }
type LogoUrls = { [team: string]: string };

function getPercentageColor(tally) {
    // Extract the percentage value from the tally string, e.g., "5/10 (50%)"
    const matches = tally.match(/\((\d+\.?\d*)%\)/);
    if (matches) {
      const percentage = parseFloat(matches[1]);
      if (percentage > 55) return 'green';
      if (percentage < 40) return 'red';
    }
    return 'orange'; // Default color if no percentage or falls between 40% and 60%
  }
  
    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.banner}></div>
        <div className={styles.navbar}>
        <Link href="/" passHref><Image src="/BRETONcrl.png" alt="Logo" width={100} height={100} className={styles.logo}/></Link>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/ncaab">NCAAB</Link></li>
            <li><Link href="/nhl">NHL</Link></li>
            <li><Link href="/mlb">MLB</Link></li>
            <li 
              onMouseEnter={() => setIsNbaDropdownVisible(true)}
              onMouseLeave={() => setIsNbaDropdownVisible(false)}
            >
              <a>NBA</a>
              {isNbaDropdownVisible && (
            <div className={styles.dropdown}>
              <Link href="/nba"><p>Over/Under</p></Link>
              <Link href="/fullprop"><p>Player Props</p></Link>
              <Link href="/prop"><p>Alt Player Props</p></Link>
            </div>
          )}
          </li>
            <li><Link href="/sub">SUBSCRIBE</Link></li>
          </ul>
          </div>
        <div className={styles.content}>
          <h1>MLB Over/Unders</h1>
          <p ref={contentRef}>Updated daily. Hit Rates (Difference): 
            <span style={{ color: getPercentageColor(tallies["2+"]) }}> 2+: {tallies["2+"]}</span> |
            <span style={{ color: getPercentageColor(tallies["1_to_2"]) }}>1-2: {tallies["1_to_2"]}</span> |
            <span style={{ color: getPercentageColor(tallies["0.5_to_1"]) }}>0.5-1.0: {tallies["0.5_to_1"]}</span> |
            <span style={{ color: getPercentageColor(tallies["-0.5_to_0.5"]) }}>(-0.5 - -1.0): {tallies["-0.5_to_0.5"]}</span> |
            <span style={{ color: getPercentageColor(tallies["-1_to_-2"]) }}>(-1-2): {tallies["-1_to_-2"]}</span> |
            <span style={{ color: getPercentageColor(tallies["-2-"]) }}>(-2+): {tallies["-2-"]}</span>
        </p>

      <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <thead>
        <th>Game</th>
            <th className={styles.tip} data-tooltip="Line from DraftKings">Total</th>
            <th className={styles.tip} data-tooltip="Modified Offense Value based upon Advanced Analytics">Away Adj Pts</th>
            <th className={styles.tip} data-tooltip="Modified Offense Value based upon Advanced Analytics">Home Adj Pts</th>
            <th className={styles.tip} data-tooltip="Combined Adjusted Offensive Totals">Adjusted Total</th>
            <th className={styles.tip} data-tooltip="Difference between Total and Adjusted Total">Difference</th>
        </thead>
        <tbody>
  {adjMatchData.length === 0 ? (
    <tr>
      <td colSpan={6}>No Games Today!</td>
    </tr>
  ) : isSubscribed ? (
    adjMatchData.map((item, index) => (
      <tr key={index}>
        <td>
          <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center'}}>
            {logos[item.Team1] && (
              <Image
                src={logos[item.Team1]}
                alt={`${item.Team1} logo`}
                width={120}
                height={100}
                style={{ marginRight: '40px' }}
              />
            )}
            {item.Team1}
            <span style={{ fontSize: '20px', margin: '30px 30px', display: 'inline-flex', alignItems: 'center', color: '#89cff0' }}>@</span>
            {logos[item.Team2] && (
              <Image
                src={logos[item.Team2]}
                alt={`${item.Team2} logo`}
                width={120}
                height={100}
                style={{ marginRight: '30px' }}
              />
            )}
            {item.Team2}
          </span>
        </td>
        <td style={{width: 80}}>{toFixed(item.original_total)}</td>
        <td style={{
          backgroundColor: item.Team1total > 6 ? 'green' :
                           item.Team1total < 3.5 ? 'red' : 'transparent' ,
        }}>{toFixed(item.Team1total)}</td>
        <td style={{
          backgroundColor: item.Team2total > 6 ? 'green' :
                           item.Team2total < 3.5 ? 'red' : 'transparent' ,
        }}>{toFixed(item.Team2total)}</td>
        <td>{toFixed(item.adj_total)}</td>
        <td style={{
          width: 110,
          backgroundColor: item.difference > 1 ? 'green' :
                           item.difference < -1 ? 'red' : 'orange' ,
          color: item.difference > 1 || item.difference < -1 ? 'white' : '',
        }}>
          {toFixed(item.difference)}
        </td>
      </tr>
    ))
  ) : (
    <>
      {adjMatchData.slice(0, 1).map((item, index) => (
        <tr key={index}>
          <td>
            <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center'}}>
              {logos[item.Team1] && (
                <Image
                  src={logos[item.Team1]}
                  alt={`${item.Team1} logo`}
                  width={120}
                  height={100}
                  style={{ marginRight: '40px' }}
                />
              )}
              {item.Team1}
              <span style={{ fontSize: '20px', margin: '30px 30px', display: 'inline-flex', alignItems: 'center', color: '#89cff0' }}>@</span>
              {logos[item.Team2] && (
                <Image
                  src={logos[item.Team2]}
                  alt={`${item.Team2} logo`}
                  width={120}
                  height={100}
                  style={{ marginRight: '30px' }}
                />
              )}
              {item.Team2}
            </span>
          </td>
          <td style={{width: 80}}>{toFixed(item.original_total)}</td>
          <td style={{
            backgroundColor: item.Team1total > 5 ? 'green' :
                             item.Team1total < 3 ? 'red' : 'transparent' ,
          }}>{toFixed(item.Team1total)}</td>
          <td style={{
            backgroundColor: item.Team2total > 5 ? 'green' :
                             item.Team2total < 3 ? 'red' : 'transparent' ,
          }}>{toFixed(item.Team2total)}</td>
          <td>{toFixed(item.adj_total)}</td>
          <td style={{
            width: 110,
            backgroundColor: item.difference > 1 ? 'green' :
                             item.difference < -1 ? 'red' : 'orange' ,
            color: item.difference > 1 || item.difference < -1 ? 'white' : '',
          }}>
            {toFixed(item.difference)}
          </td>
        </tr>
      ))}
      <tr className="blurOverlay">
        <td colSpan={6}>Free Pick of the Day! Subscribe for all Picks!</td>
      </tr>
      <Link href="https://pay.bretonpicks.com" passHref>
    <button className={styles.button}>
      <span className={styles.span}/> 
      Subscribe Here
      </button></Link>
    </>
  )}
</tbody>

      </table>
        </div>
        <div className={styles.sideNav}>
          {/* Side Navigation content */}
          <div className={styles.user}>
            <Image src="/mlb.png" alt="user-img" width={125} height={80} />
          </div>
          <h3>MLB GAMES TODAY</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
        {matchups.length === 0 ? (
          <tr>
            <td colSpan={4}>No Games Today!</td>
          </tr>
        ) : (
        matchups.map((matchup, index) => (
          <tr key={index}>
            <td>
              {logos[matchup.Team1] && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px'}}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={100} height={80} layout="fixed" />
                {matchup.Team1Spread < 0 && (
                <span className={styles.spreadValue}>({matchup.Team1Spread})</span>
              )}
            </div>
          )}
        </td>
        <span style={{ fontSize: '20px', margin: '30px 8px', display: 'inline-flex', alignItems: 'center', color: 'white'}}>@</span>
        <td>
            {logos[matchup.Team2] && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 35px' }}>
                  <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={100} height={80} layout="fixed"/>
                {matchup.Team2Spread < 0 && (
                <span className={styles.spreadValue}>({matchup.Team2Spread})</span>
              )}
            </div>
          )}
        </td>
        <td>
          {/* Display spread value here if it applies to neither or if you wish to show something else */}
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>
      </>
    );
  };
  export default MLB;