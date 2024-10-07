// pages/ncaaf.tsx
import styles from '../styles/ncaaf.module.css'; // Ensure you have Ncaab.module.css with appropriate styles
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
  point_total: number;
  difference: number;
  favorite: string;
  adjTotal: number;
  point_spread: number;
  Cover: string;
  team_1_pointsPG3: number;
  team_2_pointsPG3: number;
  margin: number;
};

type LogoUrls = { [team: string]: string };

const NcaafCover = () => {
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  // State for the logos and matchups for the sideNav
  const [logos, setLogos] = useState<LogoUrls>({});
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const tableTopSpacing = `${480}px`;
  const [isLoading, setIsLoading] = useState(true);
  const [tableMarginTop, setTableMarginTop] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResultsData] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/ncaalogo.json').then((res) => res.json()),
      fetch('/ncaafMatchups.json').then((res) => res.json()),
      fetch('/ncaafCover.json').then((res) => res.json()),
      fetch('/spread_results.json').then((res) => res.json())
    ])
      .then(([logosData, matchupsData, adjMatchOrderData, resultsData]) => {
        setLogos(logosData);
        setMatchups(matchupsData);

        // Add margin (difference) to each matchup in adjMatchOrderData
        const adjMatchDataWithMargin = adjMatchOrderData.map((matchup: AdjMatchData) => ({
          ...matchup,
          margin: Math.abs(matchup.team_1_pointsPG3 - matchup.team_2_pointsPG3) // Calculate margin for each matchup
        }));

        setAdjMatchData(adjMatchDataWithMargin); // Set adjMatchData with calculated margins
        setResultsData(resultsData);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  console.log("Matchups tables:" , adjMatchData)



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


function tableAssignments(Cover: string): string { // Function to go through difference values from adjMatchData
  if (Cover === "yes") {
    return 'table1';
  } else if (Cover === "no") {
  return 'table2';
  } else
  return 'table3'
}

// Function to assign the tableName
function filterMatchups(tableName: string) {
  return adjMatchData.filter((item) => tableAssignments(item.Cover) === tableName);
}


return (
  <>
    <Head>
      <title>BRETON</title>
      <link rel="icon" href="/bretpng.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=yes" />
    </Head>
    <div className="grid-container">
      <div className="grid-item">
        <div className={styles.banner}></div>
        <div className={styles.navbar}>
          <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
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
            <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor} />
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.headerContainer}>
            <h1>NCAAF SPREAD PREDICTIONS</h1>
          </div>
          <div className={styles.results}
            style={{
            color: 'green'
            }}
          >
          <p ref={contentRef}>
            Hit Rates: <br />
            Favorites: 20/32 (63%) <br />
            Underdogs:  17/32 (53%)
          </p>
        </div>
        </div>

        {/* Table 1 */}
        <div className={styles.MoveTable}>
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <tr>
              <th>FAVORITES PROJECTED TO COVER</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Top Favorite Plays!</td>
              </tr>
            ) : (
              filterMatchups('table1').map((item, index) => ( // Calls filterMatchups and gets which Matchups should be assigned to 'table1'
                <React.Fragment key={index}>
                  <tr className={styles.matchupRow2}>
                  <td>
                    <div className={styles.team}>
                    {logos[item.Team1] && (
                      <Image
                        src={logos[item.Team1]}
                        alt={`logo`}
                        width={60}
                        height={50}
                      />
                     
                    )}</div>
                    </td>
                     
                    <div className={styles.atSymbol}>@</div>
                    <td>
                    <div className={styles.team}>
                    {logos[item.Team2] && (
                      <Image
                        src={logos[item.Team2]}
                        alt={`logo`}
                        width={60}
                        height={50}
                      />
                    )}<br />
                    </div>
                    </td>
                    <div
                        className={styles.header}>                        
                        <br />
                        {item.favorite} <br /> <br />

                        {item.point_spread}</div>
                        <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Projected Margin</p>
                        <p>{toFixed(item.margin)}</p>
                      </div>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Cover?</p>
                        <p>YES</p>
                      </div>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <tr>
              <th>UNDERDOGS PROJECTED TO COVER</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Top Underdog Plays!</td>
              </tr>
            ) : (
              filterMatchups('table2').map((item, index) => (
                <React.Fragment key={index}>
                  <tr className={styles.matchupRow2}>
                  <td>
                    <div className={styles.team}>
                    {logos[item.Team1] && (
                      <Image
                        src={logos[item.Team1]}
                        alt={`logo`}
                        width={60}
                        height={50}
                      />
                     
                    )}</div>
                    </td>
                     
                    <div className={styles.atSymbol}>@</div>
                    <td>
                    <div className={styles.team}>
                    {logos[item.Team2] && (
                      <Image
                        src={logos[item.Team2]}
                        alt={`logo`}
                        width={60}
                        height={50}
                      />
                    )}<br />
                    </div>
                    </td>
                    <div
                        className={styles.header}>
                        <br />
                        {item.favorite} <br /> <br />
                        {item.point_spread}
                      </div>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Projected Margin</p>
                        <p>{toFixed(item.margin)}</p>
                      </div>
                    {/* Condition for Upset Alert */}
                    {item.margin > Math.abs(item.point_spread) ? (
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'orange', // Set the background color to orange for Upset Alert
                        }}
                      >
                        <p>UPSET ALERT!</p>
                      </div>
                    ) : (
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red',
                        }}
                      >
                        <p>Cover?</p>
                        <p>NO</p>
                      </div>
                    )}
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  </>
);
}
 export default NcaafCover;