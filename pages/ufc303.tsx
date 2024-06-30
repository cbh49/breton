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
    <h3>UFC 303 Best Bets</h3>
    <div className={styles.tableContainer}>
      <table className={styles.stattable1}>
        <thead>
          <tr>
            <th colSpan={2}>
              <Image src="/ufc303.jpg" width={800} height={400} alt="UFC 303 Best Bets" className={styles.tableImage} />
              <p>Generated by AI after researching Best Bets <br />Published: 6/21</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>1. Alex Pereira to win via Knockout (+110):</strong><br/>
                <em>Reasoning:</em> This pick enjoys broad support across multiple sources. Despite Jiri Prochazka's recent momentum, the consensus leans towards Pereira due to his proven power and calculated striking style. Pereira's victory over Prochazka in their previous encounter serves as a key indicator, emphasizing Pereira's superior finishing ability. Experts like Lou Finocchiaro emphasize Pereira's defensive edge and momentum from his recent knockout victory.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>2. Ian Machado Garry to win via Decision (+140):</strong><br/>
                <em>Reasoning:</em> Garry's consistent performance and technical proficiency make him a strong favorite against Michael Page. Experts highlight Garry's younger age, faster athleticism, and significant grappling advantage. While Page's unorthodox style poses a threat, Garry's well-rounded skillset and ability to control the fight from a distance make a decision victory the more probable outcome.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>3. Diego Lopes ML (-138):</strong><br/>
                <em>Reasoning:</em> This pick hinges on Lopes' emerging dominance and Ortega's declining durability. Experts point to Lopes' recent stoppage victories against top contenders and his ability to exploit Ortega's weaknesses. Although Ortega's experience and grappling prowess are undeniable, Lopes' aggressive fighting style and tactical advantage in the striking department make a decision win the more likely scenario.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>4. Anthony Smith ML (+125):</strong><br/>
                <em>Reasoning:</em> While Dolidze is the favorite, Smith's experience and well-rounded skillset make him a valuable underdog. Smith's ability to withstand Dolidze's early aggression and capitalize on his mistakes, especially on the ground, provides a clear path to victory. Experts like Lou Finocchiaro highlight Smith's veteran savvy and Dolidze's tendency to make mistakes, emphasizing the underdog's potential for an upset.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>5. Mayra Bueno Silva to win via Decision (+275):</strong><br/>
                <em>Reasoning:</em> While both fighters are considered pick 'em, Silva's consistency and ability to exploit Chiasson's weaknesses make her a slight favorite. Chiasson's tendency to make mistakes and push the pace creates opportunities for Silva, who is known for her dangerous striking and ability to capitalize on those errors. Experts suggest Silva's tactical approach and Chiasson's erratic fighting style make Silva the more likely winner.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p><strong>Additional Picks:</strong><br/>
                <strong>Fight to go the distance: Yes (-170) for Michael Page vs. Ian Machado Garry:</strong> This pick is supported by the expectation of a more tactical, grinding fight rather than an early finish. Page's unorthodox style and Garry's focus on control suggest a prolonged battle with fewer opportunities for a decisive knockout.<br/>
                <strong>Fight to go over 1.5 rounds: Yes (-190) for Brian Ortega vs. Diego Lopes:</strong> The anticipated fight style and Ortega's durability make this a strong bet. Experts predict a competitive battle with both fighters showcasing a diverse skillset, extending the fight beyond the first round.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p><strong>Disclaimer:</strong> These picks represent a consensus derived from multiple sources and expert analysis. However, sports betting involves inherent risks. Conducting your own research, considering various factors, and managing your betting responsibly is crucial.</p>
              <p><strong>Remember:</strong> This summary provides a general overview and should not be interpreted as financial advice. It's vital to conduct your own research and make informed decisions regarding sports betting.</p>
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