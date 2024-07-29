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
    <h3>UFC 304 Best Bets</h3>
    <div className={styles.tableContainer}>
      <table className={styles.stattable1}>
        <thead>
          <tr>
            <th colSpan={2}>
              <Image src="/ufc304.webp" width={800} height={400} alt="UFC 304 Best Bets" className={styles.tableImage} />
              <p>Generated by AI after researching Best Bets <br />Published: 7/27</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>1. Leon Edwards to Win by Decision (+100):</strong><br/>
                <em>Reasoning:</em> Edwards, the reigning welterweight champion, boasts a dominant 13-fight unbeaten streak. While both Edwards and his challenger, Belal Muhammad, have a tendency to go the distance and win via decision, Edwards' championship experience and recent dominance make him the clear favorite.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>2. Tom Aspinall to Win by KO/TKO/DQ in Round 1 (-110):</strong><br/>
                <em>Reasoning:</em> Aspinall has proven to be a finisher, ending his last four victories in the first round. Blaydes, on the other hand, has had his last four fights decided by KO/TKO. Their history suggests a quick conclusion. Aspinall's status as a heavy favorite makes betting on an early win a bold move but offers potential value.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>3. Paddy Pimblett (+110) to defeat Bobby Green:</strong><br/>
                <em>Reasoning:</em> Expert Kyle Marley believes Pimblett's grappling advantage will be decisive. While Green is a veteran with a solid record, Pimblett's potential to dominate on the ground makes him a compelling underdog pick.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>4. Christian Leroy Duncan (-140) to defeat Gregory Rodrigues:</strong><br/>
                <em>Reasoning:</em> Expert Daniel Vithlani favors Duncan's ability to strike effectively at range and avoid Rodrigues' power and grappling. Duncan's preference for kicking range plays to his advantage in this matchup.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>5. Giga Chikadze (+205) to defeat Arnold Allen:</strong><br/>
                <em>Reasoning:</em> While Allen is a strong contender, Chikadze's power advantage and potential for a knockout make him a tempting underdog bet. Allen's recent struggles against top featherweights also add to Chikadze's appeal.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>6. Muhammad Mokaev (-145) to defeat Manel Kape:</strong><br/>
                <em>Reasoning:</em> Mokaev's dominance in the flyweight division, particularly his submission prowess, makes him a strong favorite. Kape's striking advantage may be neutralized by Mokaev's aversion to exchanging on the feet.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>7. Nathaniel Wood (-425) to defeat Daniel Pineda:</strong><br/>
                <em>Reasoning:</em> Wood's superior striking and grappling skills make him a significant favorite. Pineda's potential upset path hinges on a successful submission attempt, which is less likely given Wood's capable grappling defense.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>8. Molly McCann (-350) to defeat Bruna Brasil:</strong><br/>
                <em>Reasoning:</em> McCann's experience, submission game, and Brasil's tendency to rely on takedowns, which are not advisable against McCann, make McCann the clear favorite.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>9. Caolan Loughran (-195) to defeat Jake Hadley:</strong><br/>
                <em>Reasoning:</em> Loughran's impressive record and Hadley's two-fight losing streak make Loughran the more likely winner. Hadley's weight miss further highlights his vulnerability in this matchup.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>10. Kiefer Crosbie (+285) to defeat Sam Patterson:</strong><br/>
                <em>Reasoning:</em> Crosbie's powerful hands and Patterson's weakness in striking and head movement create a potential upset opportunity. While a longshot, Crosbie's odds of winning via first-round KO offer significant value.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>11. Mick Parkin to win via Decision (+100) against Lukasz Brzeski:</strong><br/>
                <em>Reasoning:</em> Parkin's dominance and cautious style make him a safe bet to win via decision. His lack of finishing ability, however, makes a quick victory less likely.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>12. Oban Elliott (+120) to defeat Preston Parson:</strong><br/>
                <em>Reasoning:</em> Both fighters prefer wrestling and control, making the fight likely to go the distance. Elliot's slightly better finish rate makes him a compelling underdog pick.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>13. Marcin Prachnio (+130) to defeat Modestas Bukauskas:</strong><br/>
                <em>Reasoning:</em> Prachnio's superior striking and fight IQ make him a strong underdog pick. Bukauskas' recent knockout loss highlights his vulnerability.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>15. Shauna Bannon (-280) to defeat Alice Ardelean:</strong><br/>
                <em>Reasoning:</em> Bannon's UFC experience and Ardelean's less-than-stellar competition make Bannon the likely winner.
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