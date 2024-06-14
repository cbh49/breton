// pages/fullprop.tsx
import styles from '../styles/nba.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
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
  Total: number;
};

type PlayerPropData = {
  name: string;
  team: string;
  games_above_line: string;
  line: number;
};

type LogoUrls = { [team: string]: string };

const Fullprop = () => {
  const [ptsData, setPtsData] = useState<PlayerPropData[]>([]);
  const [rebsData, setRebsData] = useState<PlayerPropData[]>([]);
  const [astsData, setAstsData] = useState<PlayerPropData[]>([]);
  const [tableMarginTop, setTableMarginTop] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [IsChartDropdownVisible, setIsChartDropdownVisible] = useState(false);
  const tableTopSpacing = `${450}px`;

  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
      fetch('/logos.json').then(res => res.json()),
      fetch('/all_matchupsnba.json').then(res => res.json()),
      fetch('/playerpropresults.json').then(res => res.json())
    ])
      .then(([logosData, matchupsData, playerPropData]) => {
        setLogos(logosData || {});
        setMatchups(matchupsData || []);
        setPtsData(playerPropData?.PTS || []);
        setRebsData(playerPropData?.REBS || []);
        setAstsData(playerPropData?.ASTS || []);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log('PTS Data:', ptsData);
    console.log('REBS Data:', rebsData);
    console.log('ASTS Data:', astsData);

    if (contentRef.current) {
      const contentBottom = contentRef.current.getBoundingClientRect().bottom;
      const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0;
      let newMarginTop;

      if (ptsData.length === 0 && rebsData.length === 0 && astsData.length === 0) {
        // When there's no data, center the table on the screen
        newMarginTop = (window.innerHeight - contentBottom) / 2;
      } else {
        // When there's data, set a smaller margin
        newMarginTop = 20; // Or any other suitable value based on your design
      }

      setTableMarginTop(Math.max(newMarginTop, 10)); // Ensures that the margin is not less than 20px
    }
  }, [ptsData, rebsData, astsData]);

  if (isLoading) {
    return <div>Loading...</div>; // Render a loading state or spinner here
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
          <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>NBA Player Props</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/nba"><p>Over/Under</p></Link>
                <Link href="/prop"><p>ALT PROP</p></Link>
                <Link href="/fullprop"><p>PROPS</p></Link>
              </div>
            )}
          </div>
        </div>
        <p className={styles.tabletext}>Players who consistently clear their betting lines. Updated daily.</p>
        <table className={styles.table2}>
          <tbody>
            {ptsData.length === 0 ? (
              <tr className={styles.matchupRow2}>
                <td colSpan={3}>No Best Point Lines Today!</td>
              </tr>
            ) : (
              ptsData.map((item, index) => (
                <tr className={styles.matchupRow2} key={index}>
                  <div className={styles.header}><h3>POINTS</h3></div>
                  <div className={styles.header}><td>Name: <br />{`${item.name}`}</td></div>
                  <div className={styles.header}>Team: <br />
                    {logos[item.team] && (
                      <Image
                        src={logos[item.team]}
                        alt={`${item.team} logo`}
                        width={80}   // Set your desired logo size
                        height={65}
                        style={{marginLeft: '0px' }} // Add some space between the logo and the name
                      />
                    )}
                  </div>
                  <div className={styles.header}><td>Line: <br />{item.line}</td></div>
                  <div 
                    className={styles.header}
                    style={{
                      backgroundColor: item.games_above_line === '3/3' ? 'green' : 'transparent',
                      color: item.games_above_line === '3/3' ? 'white' : '',
                    }}
                  >
                    Games Above Line: <br />{item.games_above_line}
                  </div> 
                </tr>
              ))
            )}
          </tbody>
          <tbody>
            {rebsData.length === 0 ? (
              <tr className={styles.matchupRow2}>
                <td colSpan={3}>No Best Rebound Lines Today!</td>
              </tr>
            ) : (
              rebsData.map((item, index) => (
                <tr className={styles.matchupRow2} key={index}>
                  <div className={styles.header}><h3>REBOUNDS</h3></div>
                  <div className={styles.header}><td>Name: <br />{`${item.name}`}</td></div>
                  <div className={styles.header}>Team: <br />
                    {logos[item.team] && (
                      <Image
                        src={logos[item.team]}
                        alt={`${item.team} logo`}
                        width={80}   // Set your desired logo size
                        height={65}
                        style={{marginLeft: '0px' }} // Add some space between the logo and the name
                      />
                    )}
                  </div>
                  <div className={styles.header}><td>Line:<br />{item.line}</td></div>
                  <div 
                    className={styles.header}
                    style={{
                      backgroundColor: item.games_above_line === '3/3' ? 'green' : 'transparent',
                      color: item.games_above_line === '3/3' ? 'white' : '',
                    }}
                  >
                    Games Above Line: <br />{item.games_above_line}
                  </div> 
                </tr>
              ))
            )}
          </tbody>
          <tbody>
            {astsData.length === 0 ? (
              <tr className={styles.matchupRow2}>
                <td colSpan={3}>No Best Assist Lines Today!</td>
              </tr>
            ) : (
              astsData.map((item, index) => (
                <tr className={styles.matchupRow2} key={index}>
                  <div className={styles.header}><h3>ASSISTS</h3></div>
                  <div className={styles.header}><td>Name: <br />{`${item.name}`}</td></div>
                  <div className={styles.header}>Team: <br />
                    {logos[item.team] && (
                      <Image
                        src={logos[item.team]}
                        alt={`${item.team} logo`}
                        width={80}   // Set your desired logo size
                        height={65}
                        style={{marginLeft: '0px' }} // Add some space between the logo and the name
                      />
                    )}
                  </div>
                  <div className={styles.header}><td>Line:<br />{item.line}</td></div>
                  <div 
                    className={styles.header}
                    style={{
                      backgroundColor: item.games_above_line === '3/3' ? 'green' : 'transparent',
                      color: item.games_above_line === '3/3' ? 'white' : '',
                    }}
                  >
                    Games Above Line: <br />{item.games_above_line}
                  </div> 
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      <div className={styles.sideNav}>
        <div className={styles.leaguelogo}>
        <Image src="/nba.png" alt="user-img" width={60} height={90} />
        </div>
        <h3>NBA GAMES TODAY</h3>
        <table className={styles.table} style={{ top: tableTopSpacing }}>
          {/* Table content */}
          <thead>
            <tr>
            </tr>
          </thead>
          <tbody>
            {matchups.length === 0 ? (
              <tr>
                <td colSpan={4}>No Games Today!</td>
              </tr>
            ) : (
              matchups.map((matchup) => (
                <tr className={styles.matchupRow} key={matchup.id}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={80} height={70} layout="fixed" />
                  <td className={styles.atSymbol}>@</td>
                  <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={80} height={70} layout="fixed" />
                  <div className={styles.total}>O/U: {matchup.Total}</div>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Fullprop;
