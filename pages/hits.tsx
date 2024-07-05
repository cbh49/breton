//pages/hits.tsx
import styles from '../styles/prop.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
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
  PlayerName: string;
  Team: string;
  teamLogo: string;
  Line: number;
  OverUnder: string;
  HitRate: string;
  Odds: number;
  Headshot: string;
};

type LogoUrls = { [team: string]: string };


const MLB = () => {
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  // State for the logos and matchups for the sideNav
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const numGames = matchups.length;
  const tableTopSpacing = `${455}px`;
  const [isLoading, setIsLoading] = useState(true);
  const [tableMarginTop, setTableMarginTop] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [IsChartDropdownVisible, setIsChartDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    Promise.all([
      fetch('/mlblogos.json').then((res) => res.json()),
      fetch('/mlbmatchups.json').then((res) => res.json()),
      fetch('/hitProp.json').then((res) => res.json())
    ])
      .then(([logosData, matchupsData, adjMatchOrderData]) => {
        setLogos(logosData);
        setMatchups(matchupsData);
        // Add the team logos and headshots to adjMatchOrderData
        const adjMatchDataWithLogos = adjMatchOrderData.map((item: AdjMatchData) => ({
          ...item,
          teamLogo: logosData[item.Team],
          Headshot: item.Headshot  // Add this line
        }));
        setAdjMatchData(adjMatchDataWithLogos);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
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
      <div className={styles.banner}></div>
      <div className={styles.navbar}>
   
   <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
   <Link href="/" passHref></Link>
   <ul><li><Link href="/" passHref>HOME</Link></li>
   <li
       onMouseEnter={() => setIsMLBDropdownVisible(true)}
       onMouseLeave={() => setIsMLBDropdownVisible(false)}
     >
       MLB Models
       {isMLBDropdownVisible && (
         <div className={styles.dropdown}>
          <Link href="/mlb"><p>MLB O/U</p></Link>
          <Link href="/mlbml"><p>MLB ML</p></Link>
          <Link href="/nrfi"><p>NRFI</p></Link>
         </div>
       )}
     </li>
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
     <li><Link href="/news" passHref>AI Picks</Link></li>
   </ul>
   <div className={styles.odds}>
   <h4>Odds via:</h4>
   <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor}/>
   </div>
      </div>
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h1>Hit Props</h1>
          <div
            className={styles.chartButton}
            onClick={() => setIsChartDropdownVisible(!IsChartDropdownVisible)}
            onMouseLeave={() => setIsChartDropdownVisible(false)}
          >
            <a>Select</a>
            {IsChartDropdownVisible && (
              <div className={styles.dropdown}>
           <Link href="/pitchProp"><p>Strike Outs</p></Link>
           <Link href="/bases"><p>Total Bases</p></Link>
           <Link href="/hits"><p>Hits</p></Link>
           <Link href="/rbi"><p>RBIs</p></Link>
              </div>
            )}
          </div>
        </div>
        <div className={styles.results}><p ref={contentRef}>
          Player Hit Props with highest Hit Rates based upon recent performance.
        </p>
        </div>
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <tr><th>Props</th></tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Games Today!</td>
              </tr>
            ) : isSubscribed ? (
              adjMatchData.map((item) => (
                <React.Fragment key={item.PlayerName}>
                <tr className={styles.matchupRow2}>
                  <td>
                    <div className={styles.header}>
                      <Image
                        src={item.Headshot}  // Add this line
                        alt={item.PlayerName}
                        width={80}
                        height={80}
                        className={styles.headshot}  // Add appropriate CSS class if needed
                      />
                      <div className={styles.valueName}>{item.PlayerName}</div>
                    </div>
                    </td>
                    <td>
                    <div className={styles.header}>
                        <p>Team:</p>
                        <div className={styles.value}>
                            <Image
                            src={item.teamLogo}
                            alt={item.Team}
                            width={55}
                            height={55}
                            className={styles.navlogo2}
                            />
                        </div>
                        </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}>
                        <p>Line:</p>
                        <div className={styles.value}>{'0.5'}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.header}
                        style={{
                            backgroundColor: item.OverUnder === 'OVER' ? 'green' : 'UNDER' ? 'red' : 'transparent',
                                          }}>
                        <p>O/U:</p>
                        <div className={styles.value}>{(item.OverUnder)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}>
                        <p>Odds:</p>
                        <div className={styles.value}>{(item.Odds)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: item.OverUnder === 'OVER' ? 'green' : 'UNDER' ? 'red' : 'transparent',
                                        }}>
                        <p>Hit Rate:</p>
                        <div className={styles.value}>{(item.HitRate)}</div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))
  ) : (
    <>
      {adjMatchData.slice(0, 1).map((item, index) => (
        <tr key={item.PlayerName}>
                <tr className={styles.matchupRow2}>
                  <td>
                    <div className={styles.header}>
                    <p>Pitcher:</p>
                      <Image
                        src={item.Headshot}  // Add this line
                        alt={item.PlayerName}
                        width={60}
                        height={60}
                        className={styles.headshot}  // Add appropriate CSS class if needed
                      />
                      <div className={styles.valueName}>{item.PlayerName}</div>
                    </div>
                    </td>
                    <td>
                    <div className={styles.header}>
                        <p>Team:</p>
                        <div className={styles.value}>
                            <Image
                            src={item.teamLogo}
                            alt={item.Team}
                            width={55}
                            height={55}
                            className={styles.navlogo2}
                            />
                        </div>
                        </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}>
                        <p>Line:</p>
                            <div className={styles.value}>{'0.5'}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.header}
                        style={{
                            backgroundColor: item.OverUnder === 'OVER' ? 'green' : 'UNDER' ? 'red' : 'transparent',
                                          }}>
                        <p>O/U:</p>
                        <div className={styles.value}>{(item.OverUnder)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}>
                        <p>Odds:</p>
                        <div className={styles.value}>{(item.Line)}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={styles.header}>
                        <p>Hit Rate:</p>
                        <div className={styles.value}>{(item.HitRate)}</div>
                      </div>
                    </td>
                    </tr>
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
      </>
    );
  };
  export default MLB;