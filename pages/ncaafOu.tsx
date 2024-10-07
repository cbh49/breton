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
};

type LogoUrls = { [team: string]: string };

type TallyData = {
  "2+": string;
  "1_to_2": string;
  "-1_to_-2": string;
  "-2-": string;
};

const NcaafOu = () => {
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
  const [tallies, setTallies] = useState<TallyData>({
    "2+": "Loading...",
    "1_to_2": "Loading...",
    "-1_to_-2": "Loading...",
    "-2-": "Loading...",
  });

  useEffect(() => {
    Promise.all([
      fetch('/ncaalogo.json').then((res) => res.json()),
      fetch('/ncaafMatchups.json').then((res) => res.json()),
      fetch('/ncaafAdjT.json').then((res) => res.json()),
      fetch('/cumulative_tallies.json').then((res) => res.json())
    ])
      .then(([logosData, matchupsData, adjMatchOrderData, tallyData]) => {
        setLogos(logosData);
        setMatchups(matchupsData);
        setAdjMatchData(adjMatchOrderData); 
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


function tableAssignments(difference: number): string { // Function to go through difference values from adjMatchData
  if (difference >= 10 &&  difference <= 20) {
    return 'table1';
  } else if (difference >= 5 && difference < 10) {
    return 'table2';
  } else if (difference <= -10 && difference > -20) {
    return 'table4';
  } else if (difference < -20) {
    return 'table3';
  } else {
    return 'hide'; // If it does not meet criteria, gets hidden
  }
}

// Function to assign the tableName
function filterMatchups(tableName: string) {
  return adjMatchData.filter((item) => tableAssignments(item.difference) === tableName);
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
            <h1>NCAAF OVER/UNDER PREDICTIONS</h1>
          </div>
          <div className={styles.results}
          >
          <p ref={contentRef}>
            Hit Rates: <br />
            Top Over Plays: 17/25 (68%) <br />
            Next Over Plays: 13/20 (65%) <br />
            Top Under Plays:  5/11 (45%) <br />
            Next Under Plays:  4/12 (33%)
          </p>
        </div>
        </div>

        {/* Table 1 */}
        <div className={styles.MoveTable}>
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <tr>
              <th>TOP OVER PLAYS OF THE DAY</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Top over Plays!</td>
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
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                        }}
                      >
                        <p>Line:</p>
                        <p>{toFixed(item.point_total)}</p>
                      </div>
                    </td>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Projected points:</p>
                        <p>{toFixed(item.adjTotal)}</p>
                      </div>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Over?</p>
                        <p>YES</p>
                      </div>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        </div>
        <table className={styles.table2} style={{ marginTop: `${tableMarginTop}px` }}>
          <thead>
            <tr>
              <th>NEXT OVER PLAYS OF THE DAY</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Next Over Plays!</td>
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
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                        }}
                      >
                        <p>Line:</p>
                        <div className={styles.value}>
                        <p>{toFixed(item.point_total)}</p>
                        </div>
                      </div>
                    </td>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Projected points:</p>
                        <p>{toFixed(item.adjTotal)}</p>
                      </div>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'green'
                          }}
                        >
                        <p>Over?</p>
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
              <th>TOP UNDER PLAYS OF THE DAY</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Top Under Plays!</td>
              </tr>
            ) : (
              filterMatchups('table3').map((item, index) => (
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
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red'
                        }}
                      >
                        <p>Line:</p>
                        <div className={styles.value}>
                          <p>{toFixed(item.point_total)}</p>
                          </div>
                      </div>
                    </td>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red'
                          }}
                        >
                        <p>Projected points:</p>
                        <p>{toFixed(item.adjTotal)}</p>
                      </div>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'RED'
                          }}
                        >
                        <p>Over?</p>
                        <p>NO</p>
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
              <th>NEXT UNDER PLAYS OF THE DAY</th>
            </tr>
          </thead>
          <tbody>
            {adjMatchData.length === 0 ? (
              <tr>
                <td colSpan={6}>No Next Under Plays!
                </td>
              </tr>
            ) : (
              filterMatchups('table4').map((item, index) => (
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
                    <td>
                      <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red'
                        }}
                      >
                        <p>Line:</p>
                        <div className={styles.value}>
                        <p>{toFixed(item.point_total)}</p>
                        </div>
                      </div>
                    </td>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red'
                          }}
                        >
                        <p>Projected points:</p>
                        <p>{toFixed(item.adjTotal)}</p>
                      </div>
                    <div
                        className={styles.header}
                        style={{
                          backgroundColor: 'red'
                          }}
                        >
                        <p>Over?</p>
                        <p>NO</p>
                      </div>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Render other tables similarly with `filterMatchups('table2')`, `filterMatchups('table3')`, etc. */}
      </div>
    </div>
  </>
);
}
 export default NcaafOu;