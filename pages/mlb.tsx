// pages/mlb.tsx
import styles from '../styles/ncaab2.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import React, { Fragment } from 'react';

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
  Team1: string;
  Team2: string;
  Total: number;
  adj_total: number;
  difference: number;
  original_total: number;
  Team1total: number;
  Team2total: number;
  Team1Pitcher: string;
  Team2Pitcher: string;
};

type LogoUrls = { [team: string]: string };

type TallyData = {
  "2+": string;
  "1_to_2": string;
  "-1_to_-2": string;
  "-2-": string;
};

const MLB = () => {
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  // State for the logos and matchups for the sideNav
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const numGames = matchups.length;
  const tableTopSpacing = `${480}px`;
  const [isLoading, setIsLoading] = useState(true);
  const [tableMarginTop, setTableMarginTop] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [IsChartDropdownVisible, setIsChartDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tallies, setTallies] = useState<TallyData>({
    "2+": "Loading...",
    "1_to_2": "Loading...",
    "-1_to_-2": "Loading...",
    "-2-": "Loading...",
  });

  useEffect(() => {
    Promise.all([
      fetch('/mlblogos.json').then((res) => res.json()),
      fetch('/mlbmatchups.json').then((res) => res.json()),
      fetch('/mlbordered.json').then((res) => res.json()),
      fetch('/cumulative_tallies.json').then((res) => res.json())
    ])
      .then(([logosData, matchupsData, adjMatchOrderData, tallyData]) => {
        setLogos(logosData);
        setMatchups(matchupsData);
        setAdjMatchData(adjMatchOrderData); // Ensure this contains Team1Pitcher and Team2Pitcher
        setTallies(tallyData);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setTallies({
          "2+": "Error",
          "1_to_2": "Error",
          "-1_to_-2": "Error",
          "-2-": "Error",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Rotating Matchups
  const handleNextGames = () => {
    setCurrentMatchupIndex((prevIndex) => {
      const newIndex = prevIndex + 7;
      return newIndex >= matchups.length ? 0 : newIndex; // Resets to 0 if exceeds array length
    });
  };

  useEffect(() => {
    const newDisplayMatchups = matchups.slice(currentMatchupIndex, currentMatchupIndex + 6);
    setDisplayMatchups(newDisplayMatchups);
  }, [currentMatchupIndex, matchups]);

  // Table Spacing from text
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

  function getPercentageColor(tally: string) {
    // Extract the percentage value from the tally string, e.g., "5/10 (50%)"
    const matches = tally.match(/\((\d+\.?\d*)%\)/);
    if (matches) {
      const percentage = parseFloat(matches[1]);
      if (percentage > 50) return 'green';
      if (percentage < 45) return 'red';
    }
    return 'orange'; // Default color if no percentage or falls between 40% and 60%
  }

  return (
    <>
      <Head>
        <title>BRETON</title>
        <link rel="icon" href="/bretpng.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale= 1, user-scalable=yes" />
      </Head>
      <div className="grid-container">
    <div className="grid-item">
      <div className={styles.banner}></div>
      <div className={styles.navbar}>
   
   <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
   <Link href="/" passHref></Link>
   <ul>
            <li><Link href="/">HOME</Link></li>
            <li
              onMouseEnter={() => setIsMLBDropdownVisible(true)}
              onMouseLeave={() => setIsMLBDropdownVisible(false)}
            >
              MLB
              {isMLBDropdownVisible && (
                <div className={styles.dropdown}>
                  <Link href="/mlb"><p>MLB O/U</p></Link>
                  <Link href="/mlbml"><p>MLB ML</p></Link>
                  <Link href="/nrfi"><p>NRFI</p></Link>
                  <Link href="/pitchProp"><p>Strikeouts</p></Link>
                  <Link href="/hits"><p>Hits</p></Link>
                  <Link href="/bases"><p>Bases</p></Link>
                  <Link href="/rbi"><p>RBIs</p></Link>
                </div>
              )}
            </li>
            <li
              onMouseEnter={() => setIsMLBDropdownVisible(true)}
              onMouseLeave={() => setIsMLBDropdownVisible(false)}
            >
            NCAAF
              {isMLBDropdownVisible && (
                <div className={styles.dropdown}>
                  <Link href="/ncaafOu"><p>NCAAF O/U</p></Link>
                  <Link href="/ncaafCover"><p>NCAAF Spread</p></Link>
                </div>
              )}
              </li>
              <li
              onMouseEnter={() => setIsMLBDropdownVisible(true)}
              onMouseLeave={() => setIsMLBDropdownVisible(false)}
            >
            NFL
              {isMLBDropdownVisible && (
                <div className={styles.dropdown}>
                 <p> Coming Soon...</p>
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
          <h1>MLB Over/Under</h1>
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
              </div>
            )}
          </div>
        </div>
        <div className={styles.info}><p>These projections are made by pulling in each Teams Offensive, Defensive, and Pitcher recent performance and modifying them against each other. </p></div>
        <div className={styles.results}><p ref={contentRef}>
          Hit Rates (Difference): <br />
          <span style={{ color: getPercentageColor(tallies["2+"]) }}> 2+: {tallies["2+"]}</span> <br />
          <span style={{ color: getPercentageColor(tallies["1_to_2"]) }}>1-2: {tallies["1_to_2"]}</span> <br />
          <span style={{ color: getPercentageColor(tallies["-1_to_-2"]) }}>(-1-2): {tallies["-1_to_-2"]}</span> <br />
          <span style={{ color: getPercentageColor(tallies["-2-"]) }}>(-2+): {tallies["-2-"]}</span>
        </p>
        
        </div>
        
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <th>Game</th>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Games Today!</td>
              </tr>
            ) : isSubscribed ? (
              adjMatchData.map((item, index) => (
                <React.Fragment key={index}>
                  <tr className={styles.tablelogo}>
                    <td colSpan={6}>
                      <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
                      <div className={styles.spanFont}>
                        {item.Team1} <br /> <br /> P: {item.Team1Pitcher}
                        </div>
                        {logos[item.Team1] && (
                          <Image
                            src={logos[item.Team1]}
                            alt={`logo`}
                            width={60}
                            height={50}
                            style={{ marginLeft: '25px', marginRight: '25px' }}
                          />
                        )}
                        <td className={styles.atSymbol2}>@</td>
                        {logos[item.Team2] && (
                          <Image
                            src={logos[item.Team2]}
                            alt={`logo`}
                            width={60}
                            height={50}
                            style={{ marginLeft: '25px', marginRight: '25px' }}
                          />
                        )}
                        <div className={styles.spanFont}>
                        {item.Team2} <br /> <br /> P: {item.Team2Pitcher}
                        </div>
                      </span>
                    </td>
                  </tr>
                  <tr className={styles.matchupRow2}>
                    <td>
                      <div className={styles.header}>
                        <p>Line:</p>
                        <div className={styles.value}>{toFixed(item.original_total)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: item.Team1total > 4.5 ? 'green' : item.Team1total < 3 ? 'red' : 'transparent',
                        }}
                      >
                        <p>Away Proj Runs:</p>
                        <div className={styles.value}>{toFixed(item.Team1total)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: item.Team2total > 4.5 ? 'green' : item.Team2total < 3 ? 'red' : 'transparent',
                        }}
                      >
                        <p>Home Proj Runs:</p>
                        <div className={styles.value}>{toFixed(item.Team2total)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.header}>
                        <p>Projected Total:</p>
                        <div className={styles.value}>{toFixed(item.adj_total)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: item.difference > 1 ? 'green' : item.difference < -1 ? 'red' : 'orange',
                          color: item.difference > 1 || item.difference < -1 ? 'white' : '',
                        }}
                      >
                        <p>Difference:</p>
                        <div className={styles.value}>{toFixed(item.difference)}</div>
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
        <td colSpan={6}>Free Pick of the Day! Subscribe for all Picks!<Link href="https://pay.bretonpicks.com/470c3a5c-ab5a-4369-98d4-baf" passHref>
    <button className={styles.button}>
      <span className={styles.span}/> 
      Subscribe Here
      </button></Link></td>
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
  </div>
        </div>
      </>
    );
  };
  export default MLB;