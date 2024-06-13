// pages/mlb.tsx
import styles from '../styles/nhl.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
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
  MLdifference: number;
  Team1Pitcher: string;
  Team2Pitcher: string;
};

type LogoUrls = { [team: string]: string };

type TallyData = {
  "2+": string,
  "1_to_2": string,
  "-1_to_-2": string,
  "-2-": string
};

type ResultsData = {
  greater_than_2: {
    correct: number,
    total: number
  },
  between_1_and_2: {
    correct: number,
    total: number
  }
};

const MLB = () => {
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
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
    "-2-": "Loading..."
  });
  const [results, setResults] = useState<ResultsData | null>(null);

  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
      fetch('/mlblogos.json').then(res => res.json()),
      fetch('/mlbmatchups.json').then(res => res.json()),
      fetch('/mlbmlorder.json').then(res => res.json()),
      fetch('/cumulative_tallies.json').then(res => res.json()),
      fetch('/mlresults.json').then(res => res.json())
    ])
      .then(([logosData, matchupsData, adjMatchOrderData, tallyData, resultsData]) => {
        setLogos(logosData);
        setMatchups(matchupsData);
        setAdjMatchData(adjMatchOrderData);
        setTallies(tallyData);
        setResults(resultsData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setTallies({
          "2+": "Error",
          "1_to_2": "Error",
          "-1_to_-2": "Error",
          "-2-": "Error"
        });
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

  useEffect(() => {
    if (contentRef.current) {
      const contentBottom = contentRef.current.getBoundingClientRect().bottom;
      const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0;
      let newMarginTop;

      if (adjMatchData.length === 0) {
        newMarginTop = (window.innerHeight - contentBottom) / 2;
      } else {
        newMarginTop = 30;
      }

      setTableMarginTop(Math.max(newMarginTop, 30));
    }
  }, [adjMatchData]);

  function toFixed(value: number | undefined, decimals: number = 1): string {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    } else {
      return 'N/A';
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  function getPercentageColor(tally: string) {
    const matches = tally.match(/\((\d+\.?\d*)%\)/);
    if (matches) {
      const percentage = parseFloat(matches[1]);
      if (percentage > 55) return 'green';
      if (percentage < 40) return 'red';
    }
    return 'orange';
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
        <ul>
          <li><Link href="/">HOME</Link></li>
          <li
            onMouseEnter={() => setIsMLBDropdownVisible(true)}
            onMouseLeave={() => setIsMLBDropdownVisible(false)}
          >
            MLB
            {isMLBDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/mlb"><p>Over/Under</p></Link>
                <Link href="/mlbml"><p>ML PICKS</p></Link>
                <Link href="/nrfi"><p>NRFI</p></Link>
              </div>
            )}
          </li>
          <li
            onMouseEnter={() => setIsNbaDropdownVisible(true)}
            onMouseLeave={() => setIsNbaDropdownVisible(false)}
          >
            NBA
            {isNbaDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/nba"><p>Over/Under</p></Link>
                <Link href="/fullprop"><p>Player Props</p></Link>
                <Link href="/prop"><p>Alt Player Props</p></Link>
              </div>
            )}
          </li>
          <li><Link href="/news">NEWS</Link></li>
          <li><Link href="/ncaab">CBB</Link></li>
        </ul>
        <div className={styles.odds}>
          <h4>Odds via:</h4>
          <Image src="/dkvert.png" alt="Logo" width={70} height={60} className={styles.logor} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>MLB Game Picks</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/mlb"><p>Over/Under</p></Link>
                <Link href="/mlbml"><p>ML Picks</p></Link>
                <Link href="/nrfi"><p>NRFI</p></Link>
              </div>
            )}
          </div>
        </div>
        <div className={styles.results}>
          ML Results: <br />
          {results ? (
            <p>
              2+: {results.greater_than_2.correct}/{results.greater_than_2.total} ({((results.greater_than_2.correct / results.greater_than_2.total) * 100).toFixed(0)}%)<br />
              1-2: {results.between_1_and_2.correct}/{results.between_1_and_2.total} ({((results.between_1_and_2.correct / results.between_1_and_2.total) * 100).toFixed(0)}%)
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
                      <span style={{ fontSize: '11px', display: 'inline-flex', paddingLeft: '10px', alignItems: 'center' }}>
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
                            style={{ marginLeft: '30px', marginRight: '30px' }}
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
                        <p>Home Proj Runs: </p>
                        <div className={styles.value}>{toFixed(item.Team2total)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: item.MLdifference > 1 ? 'green' : item.MLdifference < 1 ? 'red' : 'transparent',
                        }}
                      >
                        <p>Difference:</p>
                        <div className={styles.value}>{toFixed(item.MLdifference)}</div>
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
                      <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
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
                    <td style={{ width: 80 }}>{toFixed(item.original_total)}</td>
                    <td style={{
                      backgroundColor: item.Team1total > 5 ? 'green' :
                        item.Team1total < 3 ? 'red' : 'transparent',
                    }}>{toFixed(item.Team1total)}</td>
                    <td style={{
                      backgroundColor: item.Team2total > 5 ? 'green' :
                        item.Team2total < 3 ? 'red' : 'transparent',
                    }}>{toFixed(item.Team2total)}</td>

                    <td style={{
                      width: 110,
                      backgroundColor: item.MLdifference > 1 ? 'green' :
                        item.MLdifference < -1 ? 'red' : 'orange',
                      color: item.MLdifference > 1 || item.MLdifference < -1 ? 'white' : '',
                    }}>
                      {toFixed(item.MLdifference)}
                    </td>
                  </tr>
                ))}
                <tr className="blurOverlay">
                  <td colSpan={4}>Free Pick of the Day! Subscribe for all Picks!<Link href="https://pay.bretonpicks.com/470c3a5c-ab5a-4369-98d4-baf" passHref>
                    <button className={styles.button}>
                      <span className={styles.span} />
                      Subscribe Here
                    </button></Link></td>
                </tr>

              </>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.sideNav} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        <div className={styles.user}>
          <Image src="/mlb.webp" alt="user-img" width={110} height={60} className={styles.leaguelogo2} />
        </div>
        <h3>MLB GAMES TODAY</h3>
        <table className={styles.table} style={{ top: tableTopSpacing }}>
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
              width={50} // Set appropriate width
              height={50} // Set appropriate height
            />
          </button>
        )}
      </div>
    </>
  );
};

export default MLB;
