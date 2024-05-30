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
};

type LogoUrls = { [team: string]: string };

const Nba = () => {
    const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
    // State for the logos and matchups for the sideNav
    const [logos, setLogos] = useState<LogoUrls>({});
    const [matchups, setMatchups] = useState<Matchup[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tableMarginTop, setTableMarginTop] = useState(0);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
    const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
    const [IsChartDropdownVisible, setIsChartDropdownVisible] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const tableTopSpacing = `${450}px`;

  useEffect(() => {
    // Fetch the logos and matchups
    Promise.all([
        fetch('/nhllogo.json').then(res => res.json()),
        fetch('/nhlgames.json').then(res => res.json()),
        fetch('/adjmatchupsorderednhl.json').then(res => res.json()),
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

    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.banner}></div>
        <div className={styles.navbar}>
      <Image src="/BRETONw.png" alt="Logo" width={100} height={100} className={styles.logo} />
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
        <li><Link href="/nhl">NHL</Link></li>
        <li><Link href="/ufl">UFL</Link></li>
        <li><Link href="/news">NEWS</Link></li>
        <li><Link href="/sub">SUBSCRIBE</Link></li>
        <li><Link href="/ncaab">CBB</Link></li>
      </ul>
    </div>
    <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>NHL Over/Under</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
                <Link href="/nhl"><p>Over/Under</p></Link>
              </div>
            )}
          </div>
        </div>
          <p ref={contentRef}>Updated daily. Hover above headers for more info.</p>
      <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
        <thead>
        <th>Game</th>
            <th className={styles.tip} data-tooltip="Line from DraftKings">Total</th>
            <th className={styles.tip} data-tooltip="Team offensive AVG of last 7 games after compared against Opponent Defense">Away Adj Pts</th>
            <th className={styles.tip} data-tooltip="Team offensive AVG of last 7 games after compared against Opponent Defense">Home Adj Pts</th>
            <th className={styles.tip} data-tooltip="Combined Adjusted Offensive Totals">Adjusted Total</th>
            <th className={styles.tip} data-tooltip="Difference between Total and Adjusted Total">Difference</th>
        </thead>
        <tbody>
        {adjMatchData.length === 0 ? (
    <tr>
      <td colSpan={6}>No Games Today!</td>
    </tr>
  ) : isSubscribed? (
    adjMatchData.map((item, index) => (
      <tr key={index}>
        <td>
        {/* Add logos next to team names */}
        <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center'}}>
          {logos[item.Team1] && (
            <Image
              src={logos[item.Team1]}
              alt={`${item.Team1} logo`}
              width={120}   // Set your desired logo size
              height={100}
              style={{ marginRight: '40px' }} // Add some space between the logo and the name
            />
          )}
          {item.Team1}
          <span style={{ fontSize: '20px' , margin: '30px 30px', display: 'inline-flex', alignItems: 'center', color: '#89cff0' }}>@</span>
          {logos[item.Team2] && (
            <Image
              src={logos[item.Team2]}
              alt={`${item.Team2} logo`}
              width={120}   // Set your desired logo size
              height={100}
              style={{ marginRight: '30px' }} // Add some space between the logo and the name
            />
          )}
          {item.Team2}
        </span>
        </td>
        <td style={{width: 80,}}>{toFixed(item.original_total)}</td>
        <td style={{
          backgroundColor: item.Team1total > 4 ? 'green' :
                           item.Team1total < 3 ? 'red' : 'transparent' ,
        }}>{toFixed(item.Team1total)}</td>
        <td style={{
          backgroundColor: item.Team2total > 4 ? 'green' :
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
            <td colSpan={6}>Free Pick of the Day! Subscribe for all Picks! <Link href="https://pay.bretonpicks.com/470c3a5c-ab5a-4369-98d4-baf" passHref>
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
          <div className={styles.user}>
            <Image src="/nhl.png" alt="user-img" width={100} height={100} />
          </div>
          <h3>NHL GAMES TODAY</h3>
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
  export default Nba;