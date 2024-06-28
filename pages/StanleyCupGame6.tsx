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
          <link rel="icon" href="/favicon.ico" />
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
  <h3>Oilers vs Panthers Game 7 Best Bets</h3>
  <div className={styles.tableContainer}>
    <table className={styles.stattable1}>
      <thead>
        <tr>
          <th colSpan={2}>
            <Image src="/mcdavid.webp" width={800} height={400} alt="Logo" className={styles.tableImage} />
            <p>Summary of articles for Oilers vs Panthers Game 7 Best Bets</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={2}>
            <p>
              This text provides several articles from different sources on the upcoming Game 7 of the Stanley Cup Final between the Edmonton Oilers and the Florida Panthers. The consensus leans towards the <strong>Oilers moneyline (-110)</strong> and the <strong>Under 5 goals (+120)</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <p>
              <strong>1. Oilers Moneyline (-110)</strong><br/>
              <em>Reasoning:</em> The Oilers have won three consecutive games after falling behind 3-0 in the series, demonstrating incredible resilience and a strong offensive surge.
              <br/>
              <strong>Sharp Action:</strong> Professionals are betting on the Panthers, potentially indicating that they see value in the underdog's ability to win the game. This suggests that the Oilers may be undervalued by the market.
              <br/>
              <strong>Goalie Performance:</strong> Stuart Skinner, the Oilers' goaltender, has been exceptional during the Oilers' comeback, allowing just 5 goals in the past three games.
              <br/>
              <strong>Historical Precedent:</strong> While rare, the Oilers are attempting to become the second team in history to win a Stanley Cup Final after being down 3-0. This suggests a potential for an upset.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <p>
              <strong>2. Under 5 Goals (+120)</strong><br/>
              <em>Reasoning:</em> Historically, Game 7s in the Stanley Cup Final have consistently been low-scoring affairs. The Under has hit in 14 consecutive Game 7s dating back to 1950.
              <br/>
              <strong>Defensive Focus:</strong> The intensity and importance of Game 7 will likely lead both teams to prioritize defense and play a more conservative style.
              <br/>
              <strong>Goalies' Performance:</strong> Both goaltenders, Stuart Skinner and Sergei Bobrovsky, are expected to play well, particularly Skinner, who has been stellar recently.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <p>
              <strong>Additional Information:</strong><br/>
              While the Oilers are a consensus pick, the <strong>Panthers' moneyline (-110)</strong> is also a valid pick, particularly given the sharp action betting on them.
              <br/>
              The <strong>Oilers +1.5 (-275)</strong> is a risk-averse bet, offering a lower payout but providing insurance against a potential Oilers loss. However, the Panthers -1.5 (+220) is not recommended due to their lack of recent wins by a large margin.
            </p>
            <p>
              <strong>Important Considerations:</strong><br/>
              Game 7 is unpredictable: Even with historical data and current trends, Game 7 of the Stanley Cup Final is a high-stakes game with the potential for unexpected outcomes.
              <br/>
              Individual player performance: The performances of key players like Connor McDavid and Sergei Bobrovsky will have a significant impact on the outcome of the game.
              <br/>
              Betting responsibly: All sports betting should be done responsibly, with a clear understanding of the risks involved.
            </p>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <p>
              <strong>In summary:</strong> The Oilers moneyline (-110) and the Under 5 goals (+120) are the consensus picks for Game 7 of the Stanley Cup Final. However, the Panthers' moneyline (-110) is also a viable option, particularly considering the sharp action supporting them.
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