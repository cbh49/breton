import { useEffect, useState, useRef } from 'react';
import styles from '../styles/nrfi.module.css'; 
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { Fragment } from 'react';

type LogoUrls = { [team: string]: string };

// Define your data types for matchups and logos
type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
  Total: number;
};

type AdjMatchData = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
  Team1Pitcher: string;
  Team1PitcherWHIP: number;
  Team1Runs: number;
  Team2Pitcher: string;
  Team2PitcherWHIP: number;
  Team2Runs: number;
  Total: number;
  PRA1: number;
  PRA2: number;
};


const MLB = () => {
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nrfiResults, setNrfiResults] = useState<{ NRFI: { correct: number, total: number }, YRFI: { correct: number, total: number } } | null>(null);
  const numGames = matchups.length;
  const [isVisible, setIsVisible] = useState(false);
  const tableTopSpacing = `${455}px`;
  const [tableMarginTop, setTableMarginTop] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [IsChartDropdownVisible, setIsChartDropdownVisible] = useState(false);


  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
      fetch('/mlblogos.json').then(res => res.json()),
      fetch('/mlbmatchups.json').then(res => res.json()),
      fetch('/sorted_NRFI.json').then(res => res.json()),
      fetch('/nrfiresults.json').then(res => res.json()) // Fetch the NRFI results
    ])
    .then(([logosData, matchupsData, adjMatchOrderData, nrfiResultsData]) => {
      setLogos(logosData);
      setMatchups(matchupsData);
      setAdjMatchData(adjMatchOrderData);
      setNrfiResults(nrfiResultsData); // Update the NRFI results state
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      // If there's an error fetching tallies, you may want to set a default message or value
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Rotating Matchups
  const handleNextGames = () => {
    setCurrentMatchupIndex(prevIndex => {
      const newIndex = prevIndex + 6;
      return newIndex >= matchups.length ? 0 : newIndex; // Resets to 0 if exceeds array length
    });
  };

  useEffect(() => {
    const newDisplayMatchups = matchups.slice(currentMatchupIndex, currentMatchupIndex + 6);
    setDisplayMatchups(newDisplayMatchups);
  }, [currentMatchupIndex, matchups]);

  // Table Spacing from Text    
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

  function toFixed(value: number | undefined, decimals: number = 2): string {
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

  function getPercentageColor(tally: string) {
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
   
   <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
   <Link href="/" passHref></Link>
   <ul><li><Link href="/" passHref>HOME</Link></li>
   <li><Link href="/mlb">MLB O/U</Link></li>
   <li><Link href="/mlbml">MLB ML</Link></li>
   <li><Link href="/nrfi">NRFI</Link></li>
     <li
       onMouseEnter={() => setIsMLBDropdownVisible(true)}
       onMouseLeave={() => setIsMLBDropdownVisible(false)}
     >
       MLB Props
       {isMLBDropdownVisible && (
         <div className={styles.dropdown}>
           <Link href="/pitchProp"><p>Strike Outs</p></Link>
           <Link href="/bases"><p>Total Bases</p></Link>
           <Link href="/hits"><p>Hits</p></Link>
           <Link href="/rbi"><p>RBIs</p></Link>
         </div>
       )}
     </li>
   </ul>
   <div className={styles.odds}>
   <h4>Odds via:</h4>
   <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor}/>
   </div>
 </div>
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>MLB NRFI</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/mlb">
                  <p>Over/Under</p>
                </Link>
                <Link href="/mlbml">
                  <p>ML Picks</p>
                </Link>
                <Link href="/nrfi">
                  <p>NRFI</p>
                </Link>
                <Link href="/pitchProp">
                  <p>Strikeouts</p>
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className={styles.results}>
          NRFI Hit Rates:
          {nrfiResults ? (
            <p>
              NRFI: {nrfiResults.NRFI.correct}/{nrfiResults.NRFI.total} ({((nrfiResults.NRFI.correct / nrfiResults.NRFI.total) * 100).toFixed(0)}%)<br />
              YRFI: {nrfiResults.YRFI.correct}/{nrfiResults.YRFI.total} ({((nrfiResults.YRFI.correct / nrfiResults.YRFI.total) * 100).toFixed(0)}%)
            </p>
          ) : (
            <p>Loading results...</p>
          )}
        </div>
      <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <thead>
          <tr>
            <th>Game</th>
          </tr>
        </thead>
        <tbody>
  {adjMatchData.length === 0 ? (
    <tr>
      <td colSpan={4}>No Games Today!</td>
    </tr>
  ) : isSubscribed ? (
    adjMatchData.map((item, index) => (
      <React.Fragment key={index}>
        <tr className={styles.tablelogo}>
          <td colSpan={6}>
            <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
              {item.Team1} <br /> <br /> P: {item.Team1Pitcher}
              {logos[item.Team1] && (
                <Image
                  src={logos[item.Team1]}
                  alt={`logo`}
                  width={60}
                  height={50}
                  style={{ marginLeft: '30px', marginRight: '30px' }}
                />
              )}
              <div className={styles.atSymbol2}>@</div>
              {logos[item.Team2] && (
                <Image
                  src={logos[item.Team2]}
                  alt={`logo`}
                  width={60}
                  height={50}
                  style={{ marginLeft: '30px', marginRight: '30px', }}
                />
              )}
              {item.Team2} <br /> <br /> P: {item.Team2Pitcher}
            </span>
          </td>
        </tr>
        <tr className={styles.matchupRow2}>  
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.PRA1 > 0.75 ? 'red' : item.PRA1 < 0.34 ? 'green' : 'transparent',
              }}
            >
              <p>Away ERA 1st:</p>
              <div className={styles.value}>{toFixed(item.PRA1)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.Team1PitcherWHIP > 1.5 ? 'red' : item.Team1PitcherWHIP < 1 ? 'green' : 'transparent',
              }}
            >
              <p>Away WHIP 1st:</p>
              <div className={styles.value}>{toFixed(item.Team1PitcherWHIP)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.Team1Runs > 1 ? 'red' : item.Team1Runs < 0.4 ? 'green' : 'transparent',
              }}
            >
              <p>Away Tm Runs 1st:</p>
              <div className={styles.value}>{toFixed(item.Team1Runs)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.PRA2 > 0.75 ? 'red' : item.PRA2 < 0.34 ? 'green' : 'transparent',
              }}
            >
              <p>Home Pitcher ERA 1st:</p>
              <div className={styles.value}>{toFixed(item.PRA2)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.Team2PitcherWHIP > 1.5 ? 'red' : item.Team2PitcherWHIP < 1 ? 'green' : 'transparent',
              }}
            >
              <p>Home WHIP 1st:</p>
              <div className={styles.value}>{toFixed(item.Team2PitcherWHIP)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.Team2Runs > 1 ? 'red' : item.Team2Runs < 0.4 ? 'green' : 'transparent',
              }}
            >
              <p>Home Tm Runs 1st:</p>
              <div className={styles.value}>{toFixed(item.Team2Runs)}</div>
            </div>
          </td>
          <td>
            <div
              className={styles.header}
              style={{
                backgroundColor: item.Total < .75 ? 'green' : item.Total > 1 ? 'red' : 'orange',
                color: item.Total > 1 || item.Total < -1 ? 'white' : '',
              }}
            >
              <p>Proj. 1st Runs:</p>
              <div className={styles.value}>{toFixed(item.Total)}</div>
            </div>
          </td>
        </tr>
      </React.Fragment>
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
              <span style={{ fontSize: '15px', margin: '30px 30px', display: 'inline-flex', alignItems: 'center', color: '#89cff0' }}>@</span>
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
          <td>{item.Team1Pitcher}</td>
          <td style={{
                width: 90,
                backgroundColor: item.PRA1 < 0.34 ? 'green' :
                                item.PRA1 > 0.99 ? 'red' : '' ,
            }}>{toFixed(item.PRA1)}</td>
          <td style={{
                width: 90,
                backgroundColor: item.Team1PitcherWHIP < 1 ? 'green' :
                                item.Team1PitcherWHIP > 1.5 ? 'red' : '' ,
            }}>{toFixed(item.Team1PitcherWHIP)}</td>
          <td style={{
                width: 90,
                backgroundColor: item.Team1Runs < 0.34 ? 'green' :
                                item.Team1Runs > 1 ? 'red' : '' ,
            }}>{toFixed(item.Team1Runs)}</td>
          <td>{item.Team2Pitcher}</td>
          <td style={{
                width: 90,
                backgroundColor: item.PRA2 < 0.34 ? 'green' :
                                item.PRA2 > 0.99 ? 'red' : '' ,
            }}>{toFixed(item.PRA2)}</td>
          <td style={{
                width: 90,
                backgroundColor: item.Team2PitcherWHIP < 1 ? 'green' :
                                item.Team2PitcherWHIP > 1.5 ? 'red' : '' ,
            }}>{toFixed(item.Team2PitcherWHIP)}</td>
          <td style={{
                width: 90,
                backgroundColor: item.Team2Runs < 0.34 ? 'green' :
                                item.Team2Runs > 1 ? 'red' : '' ,
            }}>{toFixed(item.Team2Runs)}</td>
          <td style={{
                width: 90,
                backgroundColor: item.Total < 1 ? 'green' :
                                item.Total > 1 ? 'red' : 'orange' ,
            }}>{toFixed(item.Total)}</td>
        </tr>
      
      ))}
      <tr className="blurOverlay">
        <td colSpan={10}>Free Pick of the Day! Subscribe for all Picks!
          <Link href="https://pay.bretonpicks.com/470c3a5c-ab5a-4369-98d4-baf" passHref>
            <button className={styles.button}>
              <span className={styles.span}/> 
              Subscribe Here
            </button>
          </Link>
        </td>
      </tr>
    </>
  )}
</tbody>
</table>
</div>
  
<div className={styles.sideNav} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      <div className={styles.leaguelogo}>
        <Image src="/mlb.webp" alt="user-img" width={110} height={60} />
      </div>
      <h3>MLB GAMES TODAY</h3>
      <table className={styles.table} style={{ top: tableTopSpacing }}>
        {/* Table content */}
        <thead>
          <tr>
          </tr>
        </thead>
              <tbody>
        {displayMatchups.length === 0 ? (
          <tr>
            <td colSpan={4}>No Games Today!</td>
          </tr>
        ) : (
          displayMatchups.map((matchup) => (
            <tr key={matchup.id} className={styles.matchupRow}>
                <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={80} height={70} className={styles.navlogo} layout="fixed" />  
              <td className={styles.atSymbol}>@</td>   
                <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={80} height={70} className={styles.navlogo} layout="fixed" />
              <div className={styles.total}>O/U: {matchup.Total}</div>
            </tr>
            
          ))
        )}
        
      </tbody>
      </table>
      {isVisible && (
    <button onClick={handleNextGames} className={styles.nextButton} title="Next Games">
    <Image
      src="/right-arrow.png" // Update with your actual image path
      alt="Next 7 Games"
      width={30} // Set appropriate width
      height={30} // Set appropriate height
    />
  </button>
  )}
  </div>

</>
    );
  };
  export default MLB;