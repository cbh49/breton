// pages/nba.tsx
import styles from '../styles/ncaab.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, ReactNode } from 'react';

// Define your data types for matchups and logos
type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
};

type AdjMatchData = {
  line: ReactNode;
  games_above_alt_line: string;
  team: any;
  name: any;
  Team1: string;
  Team2: string;
  Total: number;
  team1_offense_b: number;
  team2_offense_b: number;
  AdjTotal: number;
  Difference: number;
};

type LogoUrls = { [team: string]: string };

const Fullprop = () => {
    const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
    const [adjMatchDataA, setAdjMatchDataA] = useState<AdjMatchData[]>([]);
    const [adjMatchDataB, setAdjMatchDataB] = useState<AdjMatchData[]>([]);
    const [tableMarginTop, setTableMarginTop] = useState(0);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [logos, setLogos] = useState<LogoUrls>({});
    const [matchups, setMatchups] = useState<Matchup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);

  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
        fetch('/logos.json').then(res => res.json()),
        fetch('/all_matchupsnba.json').then(res => res.json()),
        fetch('/ptsnbaprops.json').then(res => res.json()),
        fetch('/rebsnbaprops.json').then(res => res.json()),
        fetch('/astsnbaprops.json').then(res => res.json()),
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
      
          setTableMarginTop(Math.max(newMarginTop, 10)); // Ensures that the margin is not less than 20px
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
          <h1>NBA Player Props</h1>
          <p ref={contentRef}>Players who consistently clear their betting lines. Updated daily.</p>
          <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Betting Line (Pts)</th>
            <th>Hit rate</th>
            </tr>
        </thead>
        <tbody>
      {adjMatchData.length === 0 ? (
    <tr>
      <td colSpan={6}>No Best Point Lines Today!</td>
    </tr>
      ) : (
    adjMatchData.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.line}</td>
            <td style={{
              backgroundColor: item.games_above_alt_line === '3/3' ? 'green' : 'transparent',
              color: item.games_above_alt_line === '3/3' ? 'white' : '',
        }}>
            {item.games_above_alt_line}
          </td>
        </tr>
        ))
      )}
        </tbody>
      <thead>
          <tr>
            <th>Player</th>
            <th>Betting Line (Rebs)</th>
            <th>Hit rate</th>
            </tr>
        </thead>
        <tbody>
      {adjMatchDataA.length === 0 ? (
    <tr>
      <td colSpan={6}>No Best Rebound Lines Today!</td>
    </tr>
      ) : (
    adjMatchDataA.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.line}</td>
            <td style={{
                backgroundColor: item.games_above_alt_line === '3/3' ? 'green' : 'transparent',
                color: item.games_above_alt_line === '3/3' ? 'white' : '',
          }}>
              {item.games_above_alt_line}
          </td>
        </tr>
        ))
      )}
        </tbody>
        <thead>
          <tr>
            <th>Player</th>
            <th>Betting Line (Asts)</th>
            <th>Hit rate</th>
            </tr>
        </thead>
        <tbody>
        {adjMatchDataB.length === 0 ? (
    <tr>
      <td colSpan={6}>No Best Assist Lines Today!</td>
    </tr>
      ) : (
    adjMatchDataB.map((item, index) => (
        <tr key={index}>
            <td>{`${item.name} (${item.team})`}</td>
            <td>{item.line}</td>
            <td style={{
        backgroundColor: item.games_above_alt_line === '3/3' ? 'green' : 'transparent',
        color: item.games_above_alt_line === '3/3' ? 'white' : '',
      }}>
        {item.games_above_alt_line}
      </td>
        </tr>
        ))
      )}
        </tbody>
      </table>
        </div>
        <div className={styles.sideNav}>
          {/* Side Navigation content */}
          <div className={styles.user}>
            <Image src="/nbalogo.png" alt="user-img" width={100} height={100} />
          </div>
          <h3>NBA GAMES TODAY</h3>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={150} height={100} layout="fixed" />
            </div>
          )}
        </td>
        <td>@</td>
        <td>
            {logos[matchup.Team2] && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={150} height={100} layout="fixed" />
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
  export default Fullprop;