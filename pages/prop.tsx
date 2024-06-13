// pages/nba.tsx
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

type AdjMatchData = {
  games_above_alt_line: string;
  name: string;
  alt_line: number;
  team: string;
};

type LogoUrls = { [team: string]: string };

const Prop = () => {
    const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
    const [adjMatchDataA, setAdjMatchDataA] = useState<AdjMatchData[]>([]);
    const [adjMatchDataB, setAdjMatchDataB] = useState<AdjMatchData[]>([]);
    const [tableMarginTop, setTableMarginTop] = useState(0);
    const contentRef = useRef<HTMLParagraphElement>(null);
    // State for the logos and matchups for the sideNav
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
        fetch('/playerpropresults.json').then(res => res.json()),
        fetch('/summary_data_rebs.json').then(res => res.json()),
        fetch('/summary_data_asts.json').then(res => res.json()),
      ])
      .then(([logosData, matchupsData, adjMatchOrderData, adjMatchOrderDataA, adjMatchOrderDataB]) => {
        // Set the state with fetched data
        setLogos(logosData);
        setMatchups(matchupsData);
        setAdjMatchData(adjMatchOrderData);
        setAdjMatchDataA(adjMatchOrderDataA);
        setAdjMatchDataB(adjMatchOrderDataB);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
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

  if (isLoading) {
    return <div>Loading...</div>; // Render a loading state or spinner here
  }
type LogoUrls = { [team: string]: string };

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
          <h1>ALT NBA Player Props</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/nba"><p>Over/Under</p></Link>
                <Link href="/prop"><p>ALT PROPS</p></Link>
                <Link href="/fullprop"><p>PROPS</p></Link>
              </div>
            )}
          </div>
        </div>
          <p className={styles.tabletext}>Players who consistently clear their alternate lines. Updated daily.</p>
          <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <tbody>
      {adjMatchData.length === 0 ? (
    <tr className={styles.matchupRow2}>
      <td colSpan={6}>No Point Alt Lines Today!</td>
    </tr >
      ) : (
    adjMatchData.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.alt_line}</td>
            <td style={{
              backgroundColor: item.games_above_alt_line === '5/5' ? 'green' : 'transparent',
              color: item.games_above_alt_line === '5/5' ? 'white' : '',
        }}>
            {item.games_above_alt_line}</td>
        </tr>
        ))
      )}
        </tbody>
        <tbody>
      {adjMatchDataA.length === 0 ? (
    <tr className={styles.matchupRow2}>
      <td colSpan={6}>No Rebound Alt Lines Today!</td>
    </tr>
      ) : (
    adjMatchDataA.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.alt_line}</td>
            <td style={{
              backgroundColor: item.games_above_alt_line === '5/5' ? 'green' : 'transparent',
              color: item.games_above_alt_line === '5/5' ? 'white' : '',
        }}>
            {item.games_above_alt_line}</td>
        </tr>
        ))
      )}
        </tbody>
        <tbody>
        {adjMatchDataB.length === 0 ? (
    <tr className={styles.matchupRow2}>
      <td colSpan={6}>No Assist Alt Lines Today!</td>
    </tr>
      ) : (
    adjMatchDataB.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.alt_line}</td>
            <td style={{
              backgroundColor: item.games_above_alt_line === '5/5' ? 'green' : 'transparent',
              color: item.games_above_alt_line === '5/5' ? 'white' : '',
        }}>
            {item.games_above_alt_line}</td>
        </tr>
        ))
      )}
        </tbody>
      </table>
        </div>
        <div className={styles.sideNav}>
          <div className={styles.leaguelogo}>
            <Image src="/nba.png" alt="user-img" width={70} height={90} />
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
            <tr key={matchup.id} className={styles.matchupRow}>
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
  export default Prop;