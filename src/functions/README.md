# Functions Directory

This directory contains utility functions and type definitions that have been extracted from the main components to improve code organization and reusability.

## Files

### `types.ts`
- **Purpose**: Contains all TypeScript interface definitions
- **Exports**: `Matchup`, `TeamStats`, `FavoriteInfo`, `MatchupRowProps`

### `bettingUtils.ts`
- **Purpose**: Utilities for betting-related calculations
- **Functions**:
  - `getFavoriteInfo(matchup)`: Determines favorite team based on moneyline values
  - `getFavoriteLogo(favoriteTeam, team1, team1Logo, team2Logo)`: Gets the logo for the favorite team

### `statsUtils.ts`
- **Purpose**: Utilities for statistics calculations and display
- **Functions**:
  - `getAdvantage(team1OffenseRank, team2DefenseRank, team1, team2)`: Determines which team has advantage
  - `getAdvantageLogo(team1OffenseRank, team2DefenseRank, team1Logo, team2Logo)`: Gets logo for advantage team
  - `getRankColorClass(rank)`: Returns CSS class for rank color coding

### `index.ts`
- **Purpose**: Barrel export file for easy importing
- **Exports**: All types and functions from other files

## Usage

```typescript
import { 
  getFavoriteInfo, 
  getFavoriteLogo, 
  getRankColorClass,
  type Matchup,
  type TeamStats
} from '../functions';
```

## Benefits

1. **Code Organization**: Functions are logically grouped by purpose
2. **Reusability**: Functions can be easily reused across components
3. **Maintainability**: Changes to logic are centralized
4. **Testability**: Functions can be unit tested independently
5. **Type Safety**: All types are centrally defined and exported
