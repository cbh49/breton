// pages/ncaab.tsx
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
};

type AdjMatchData = {
  Team1: string;
  Team2: string;
  Total: number;
  team1_offense_b: number;
  team2_offense_b: number;
  AdjTotal: number;
  Difference: number;
  Team2total: number;
};

type LogoUrls = { [team: string]: string };

const Ncaab = () => {
    const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
    // State for the logos and matchups for the sideNav
    const [logos, setLogos] = useState<LogoUrls>({});
    const [matchups, setMatchups] = useState<Matchup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
    const [tableMarginTop, setTableMarginTop] = useState(0);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);

  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
        fetch('/ncaalogo.json').then(res => res.json()),
        fetch('/all_matchups.json').then(res => res.json()),
        fetch('/adjmatchorder.json').then(res => res.json()),
      ])
      .then(([logosData, matchupsData, adjMatchOrderData]) => {
        // Set the state with fetched data
        setLogos(logosData);
        setMatchups(matchupsData);
        setAdjMatchData(adjMatchOrderData);
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
          <h1>NCAAB Over/Unders</h1>
          <p ref={contentRef}>Updated daily.</p>
          <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <thead>
        <th>Game</th>
        </thead>
        <tbody>
  {adjMatchData.length === 0 ? (
    <tr>
      <td colSpan={6}>2023-24 Season is over. Model finished at a 63% hit rate! Great year, see you in November!</td>
    </tr>
  ) : (
    adjMatchData.map((item, index) => (
      <tr key={index}>
        <td>
          {/* Add logos next to team names */}
          <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
            {logos[item.Team1] && (
              <Image
                src={logos[item.Team1]}
                alt={`${item.Team1} logo`}
                width={125}   // Set your desired logo size
                height={100}
                style={{ marginRight: '8px' }} // Add some space between the logo and the name
              />
            )}
            {item.Team1}
            <span style={{ fontSize: '20px', margin: '0 8px', display: 'inline-flex', alignItems: 'center', color: '#89cff0' }}>@</span>
            {logos[item.Team2] && (
              <Image
                src={logos[item.Team2]}
                alt={`${item.Team2} logo`}
                width={125}   // Set your desired logo size
                height={100}
                style={{ marginRight: '10px' }} // Add some space between the logo and the name
              />
            )}
            {item.Team2}
          </span>
        </td>
        <td>{item.Total}</td>
        <td style = {{
          backgroundColor: item.Team2total > 80 ? 'green' :
          item.Team2total < 65 ? 'red' : 'transparent' ,
          }}>{item.team1_offense_b !== undefined ? item.team1_offense_b.toFixed(2) : 'N/A'}</td>
        <td style = {{
          backgroundColor: item.Team2total > 80 ? 'green' :
          item.Team2total < 65 ? 'red' : 'transparent' ,
          }}>{item.team2_offense_b !== undefined ? item.team2_offense_b.toFixed(2) : 'N/A'}</td>
        <td>{item.AdjTotal !== undefined ? item.AdjTotal.toFixed(2) : 'N/A'}</td>
        <td style={{
        width: 110,
          backgroundColor: item.Difference > 10 ? 'green' :
                           item.Difference < -5 ? 'red' : 'orange'
        }}>{item.Difference !== undefined ? item.Difference.toFixed(2) : 'N/A'}</td>
      </tr>
    ))
  )}
</tbody>
      </table>
        </div>
        <div className={styles.sideNav}>
          {/* Side Navigation content */}
          <div className={styles.user}>
            <Image src="/mm2.png" alt="user-img" width={100} height={100} />
          </div>
          <h3>MARCH MADNESS TODAY</h3>
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
              <td colSpan={3}>No Games Today!</td>
            </tr>
              ) : (
              matchups.map((matchup, index) => (
              <tr key={index}>
                <td>
                {logos[matchup.Team1] && (
                <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={100} height={80} layout="fixed" />
              )}
            </td>
              <td>vs</td>
            <td>
              {logos[matchup.Team2] && (
                <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={100} height={80} layout="fixed" />
              )}
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
  export default Ncaab;