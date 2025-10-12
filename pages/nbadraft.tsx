// pages/index.tsx
import styles from '../styles/news.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// Define the matchup type if you have specific structure for matchup data
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

const Home = () => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const numGames = matchups.length;
  const tableTopSpacing = `${450}px`;
  const [isLoading, setIsLoading] = useState(true);
  const [tableMarginTop, setTableMarginTop] = useState(0);

  useEffect(() => {
    // Fetch the logos on component mount
    fetch('/mlblogos.json')
      .then(response => response.json())
      .then(data => setLogos(data))
      .catch(error => console.error('Error fetching logos:', error));

      fetch('/mlbmatchups.json')
      .then(response => response.json())
      .then((data: Matchup[]) => {  // Explicitly type 'data' as an array of 'Matchup'
        setMatchups(data);
        data.forEach((matchup: Matchup) => {  // Now 'matchup' is also typed as 'Matchup'
          console.log(matchup.team2Logo);
        });
      })
      .catch(error => console.error('Error fetching matchups:', error));
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
        // When there's no data, center the table on the screen
        newMarginTop = (window.innerHeight - contentBottom) / 2;
      } else {
        // When there's data, set a smaller margin
        newMarginTop = 30; // Or any other suitable value based on your design
      }

      setTableMarginTop(Math.max(newMarginTop, 30)); // Ensures that the margin is not less than 20px
    }
  }, [adjMatchData]);
    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/bretpng.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale= 1, user-scalable=yes" />
        </Head>
        <div className={styles.banner2}>
        </div>
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
      <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor} />
      </div>
    </div>
    <div className={styles.content2}>
  <span className={styles.span}/> 
  <h3>NBA 2024 Mock Draft Best Bets</h3>
  <div className={styles.tableContainer}>
  <table className={styles.stattable1}>
      <thead>
        <tr>
          <th colSpan={2}>
            <Image src="/nbadraft.png" width={800} height={400} alt="NBA Draft" className={styles.tableImage} />
            <p>Summary of articles for NBA 2024 First Round Mock Draft Best Bets</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={2}>
            <p>
              This mock draft is based on the analysis of multiple mock drafts from various sources, taking into account the consensus and individual expert opinions. The likelihood percentages reflect the frequency of each player being projected at that specific pick.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <table className={styles.innerTable}>
              <thead>
                <tr>
                  <th>Pick</th>
                  <th>Player</th>
                  <th>Position</th>
                  <th>Team</th>
                  <th>Likelihood %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Zaccharie Risacher</td>
                  <td>G/F</td>
                  <td>Atlanta Hawks</td>
                  <td>80%</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Alexandre Sarr</td>
                  <td>F/C</td>
                  <td>Washington Wizards</td>
                  <td>60%</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Reed Sheppard</td>
                  <td>G</td>
                  <td>Houston Rockets</td>
                  <td>70%</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Stephon Castle</td>
                  <td>G</td>
                  <td>San Antonio Spurs</td>
                  <td>50%</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Matas Buzelis</td>
                  <td>F</td>
                  <td>Detroit Pistons</td>
                  <td>60%</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Donovan Clingan</td>
                  <td>C</td>
                  <td>Charlotte Hornets</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Cody Williams</td>
                  <td>F</td>
                  <td>Portland Trail Blazers</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>8</td>
                  <td>Tidjane Salaun</td>
                  <td>F</td>
                  <td>San Antonio Spurs</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>9</td>
                  <td>Ron Holland II</td>
                  <td>F</td>
                  <td>Memphis Grizzlies</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td>Dalton Knecht</td>
                  <td>G/F</td>
                  <td>Utah Jazz</td>
                  <td>50%</td>
                </tr>
                <tr>
                  <td>11</td>
                  <td>Devin Carter</td>
                  <td>G</td>
                  <td>Chicago Bulls</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>12</td>
                  <td>Robert Dillingham</td>
                  <td>G</td>
                  <td>Oklahoma City Thunder</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>13</td>
                  <td>Ja’Kobe Walter</td>
                  <td>G/F</td>
                  <td>Sacramento Kings</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>14</td>
                  <td>Tristan da Silva</td>
                  <td>F</td>
                  <td>Portland Trail Blazers</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>15</td>
                  <td>Nikola Topic</td>
                  <td>G</td>
                  <td>Indiana Pacers</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>16</td>
                  <td>Zach Edey</td>
                  <td>C</td>
                  <td>Miami Heat</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>17</td>
                  <td>Jared McCain</td>
                  <td>G</td>
                  <td>New Orleans Pelicans</td>
                  <td>40%</td>
                </tr>
                <tr>
                  <td>18</td>
                  <td>Tyler Kolek</td>
                  <td>G</td>
                  <td>Philadelphia 76ers</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>19</td>
                  <td>Johnny Furphy</td>
                  <td>G</td>
                  <td>Los Angeles Lakers</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td>20</td>
                  <td>Isaiah Collier</td>
                  <td>G</td>
                  <td>New York Knicks</td>
                  <td>20%</td>
                </tr>
                <tr>
                  <td>21</td>
                  <td>Carlton "Bub" Carrington</td>
                  <td>G</td>
                  <td>Toronto Raptors</td>
                  <td>20%</td>
                </tr>
                <tr>
                  <td>22</td>
                  <td>Yves Missi</td>
                  <td>F</td>
                  <td>Denver Nuggets</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td>23</td>
                  <td>Kyle Filipowski</td>
                  <td>C</td>
                  <td>Brooklyn Nets</td>
                  <td>20%</td>
                </tr>
                <tr>
                  <td>24</td>
                  <td>Ryan Dunn</td>
                  <td>G</td>
                  <td>Orlando Magic</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td>25</td>
                  <td>Kel'el Ware</td>
                  <td>C</td>
                  <td>Dallas Mavericks</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td>26</td>
                  <td>Terrence Shannon Jr.</td>
                  <td>G</td>
                  <td>Phoenix Suns</td>
                  <td>20%</td>
                </tr>
                <tr>
                  <td>27</td>
                  <td>KJ Simpson</td>
                  <td>G</td>
                  <td>Boston Celtics</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td>28</td>
                  <td>DaRon Holmes II</td>
                  <td>C</td>
                  <td>Minnesota Timberwolves</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td>29</td>
                  <td>Pacome Dadiet</td>
                  <td>F</td>
                  <td>New York Knicks</td>
                  <td>10%</td>
                </tr>
                <tr>
                  <td>30</td>
                  <td>Baylor Scheierman</td>
                  <td>G/F</td>
                  <td>Milwaukee Bucks</td>
                  <td>15%</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <p><strong>Notes:</strong></p>
            <ul>
            <div className={styles.notesText}>
              <li>This draft is based on the consensus of multiple sources, with higher percentages indicating greater likelihood based on the available data.</li>
              <li>Players with higher likelihoods are more frequently projected to go in that position across different mock drafts.</li>
              <li>This draft does not consider potential trades, which can significantly affect the final outcome.</li>
              <li>It is important to note that this is just a prediction and the actual draft order can change considerably.</li>
              </div>
            </ul>
            <p>
              This mock draft can be used as a starting point to understand the potential directions of the 2024 NBA Draft. As the draft approaches, new information and developments will likely change the landscape of the draft order and the players' projected positions.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  </div>


  </>
);
};

export default Home;