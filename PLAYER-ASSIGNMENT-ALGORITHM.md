# Player Assignment Algorithm

This document explains how FC 26 ICON DRAFT assigns players to participants.

The implementation is primarily located in:

- `src/utils/playerAllocation.ts`
- `src/utils/random.ts`
- `src/utils/formations.ts`

## Overview

When a tournament is generated, the application:

1. Validates that every ICON has a unique database ID.
2. Randomizes the order in which participants receive each pick.
3. Creates a position plan for each participant's formation.
4. Selects one eligible, available ICON for each position.
5. Immediately marks each selected ICON as unavailable globally.
6. Continues until every participant has a complete 10-player squad.

The original participant order is preserved in the final tournament data. Only the internal allocation order is randomized.

The allocator is round-based rather than squad-based. In each position round,
every participant receives one player before the next round begins. This stops
one participant from receiving an entire squad of high-rated players before
the other participants get a chance to pick.

## Step 1: Validate ICON IDs

Before assigning any players, `generateTournament()` calls
`validateUniqueIconIds()`.

Every ICON must have a unique `id`. IDs are used instead of player names because:

- Two players could have similar names.
- A player can have multiple eligible positions.
- Duplicate prevention must work reliably across the entire tournament.

If duplicate IDs are found, generation stops and an error is shown instead of creating an unsafe draft.

## Step 2: Randomize Participant Allocation Order

For every pick round, the participant indexes are shuffled. For example, a
round may be processed as:

```ts
Jordan, Samuel, Taylor, Alex
```

The next round receives a new random order. The participant index ensures each
pick still uses that participant's selected formation and is stored in the
correct squad.

This prevents the first participant from always receiving the first available group of players.

## Step 3: Balance Squad Ratings

The allocator keeps a running rating total for every participant. For each
pick, it calculates:

- The participant's current squad rating total.
- The average current rating total across participants.
- The average rating of the currently eligible candidates.
- A target projected total for the next pick.

The target is approximately:

```text
average current squad total + average eligible candidate rating
```

Eligible candidates are then ranked by how close the participant's projected
rating total would be to that target. The closest candidate is selected, with
the candidate list shuffled first to preserve randomness when choices are
similarly rated.

This creates a balancing effect:

- Participants below the current average are more likely to receive stronger
  available cards.
- Participants above the current average are more likely to receive lower
  available cards.
- Ratings never determine eligibility.
- The highest-rated card is not automatically assigned to the first
  participant.

This is balancing rather than a fixed equal-rating guarantee. Position
eligibility and global uniqueness can limit the exact final totals.

## Step 4: Prevent the Top-Rated Pair from Sharing a Squad

The candidate filter applies one additional squad-level rule: `pele` and
`ronaldo` are an exclusive pair. If one of these database IDs is already in a
participant's squad, the other is excluded from that participant's remaining
candidates.

This rule does not remove either player from the tournament. The excluded ICON
can still be assigned to another participant, subject to global uniqueness and
position eligibility. If the rule leaves no eligible player for a required
position, generation stops with the normal allocation error instead of
assigning an invalid or duplicate player.

## Step 5: Create the Position Plan

The application supports two formations.

### 4-1-3-1

The position plan contains:

```text
GK
CB
CB
LB
RB
CDM
CAM
LW
RW
ST
```

This gives the participant ten players:

- 1 goalkeeper
- 2 centre backs
- 1 left back
- 1 right back
- 1 defensive midfielder
- 1 attacking midfielder
- 1 left winger
- 1 right winger
- 1 striker

### 4-1-2-2

The position plan contains:

```text
GK
CB
CB
LB
RB
CDM
CAM
LW or RW
ST
ST
```

The application randomly chooses either `LW` or `RW`. It does not assign both winger positions in this formation.

The `CAM` remains a separate central position.

## Step 6: Find Eligible Candidates

For every required position, the allocator filters the complete ICON database.

An ICON is eligible when:

```ts
player.position === requiredPosition
```

or when the required position is listed in the player's secondary positions:

```ts
player.secondary?.includes(requiredPosition)
```

For example, a player whose primary position is `CB` and whose secondary positions include `CDM` can be selected for a `CDM` slot.

Goalkeepers cannot be selected for outfield positions unless the database explicitly lists that position as eligible.

## Step 7: Prevent Duplicates Within a Squad

Each squad has a local `Set<string>` called `localIds`.

Before a candidate can be selected, its ID must not already be in this set:

```ts
!localIds.has(player.id)
```

This prevents the same ICON from appearing twice in one participant's squad, even if the player is eligible for multiple positions.

## Step 8: Prevent Duplicates Across the Tournament

The complete tournament has a global `Set<string>` called `used`.

Before a candidate can be selected, its ID must not be in the global unavailable set:

```ts
!unavailable.has(player.id)
```

After a squad is successfully created, every selected ID is added to the global set:

```ts
result.used.forEach((id) => used.add(id));
```

This makes each ICON unavailable to every participant who is processed afterward.

The result is:

```text
No duplicate ICON IDs within one squad.
No duplicate ICON IDs across the current tournament.
```

## Step 9: Randomize Candidates

After filtering for:

- Position eligibility
- Local squad availability
- Global tournament availability
- Exclusive Pelé/Ronaldo pair rule

the remaining candidates are shuffled using Fisher-Yates before the
rating-balancing choice is made.

The selected player is the eligible candidate that best maintains the current
rating balance, with shuffle order breaking ties.

This means the algorithm does not intentionally select:

- The highest-rated player.
- The first player in the database.
- The same predictable player sequence every time.

Ratings are retained as player data and are used only for the fairness
balancing described in Step 3.

## Step 10: Assign the Display Position

When a player is selected, the application copies the player object and assigns the position required by the squad slot:

```ts
picked.push({ ...choice, position });
```

This allows a player with an eligible secondary position to appear correctly in the selected tactical slot.

For example, if a player is eligible for `CAM` through their secondary positions, their squad entry will display as `CAM`.

## Step 11: Handle Insufficient Availability

If no eligible candidate remains for a required position, the allocator throws an error:

```text
Not enough available ICONs for [position] while building [participant]'s squad.
```

The application catches this error during tournament generation and displays it to the organizer.

It does not:

- Create a duplicate.
- Assign an invalid position.
- Silently reduce the squad size.
- Substitute an unrelated player.

## Tournament Generation Pseudocode

```text
validate every ICON ID is unique

create empty global used-ID set
shuffle participant allocation order

for each participant in randomized order:
    create the participant's position plan
    create empty local used-ID set
    create empty squad

    for each required position:
        find ICONs that:
            are eligible for the position
            are not in the local used-ID set
            are not in the global used-ID set

        shuffle eligible ICONs

        if no candidate exists:
            stop and report an allocation error

        select the first candidate
        copy it with the assigned position
        add its ID to the local used-ID set
        add its ID to the squad's used IDs

    add the squad's used IDs to the global used-ID set
    store the squad in the participant's original slot

return the completed tournament
```

## Squad Redraw Behavior

When a participant redraws:

1. The participant's existing players are excluded from the unavailable set.
2. All other participants' current players remain unavailable.
3. A new squad is generated using the same position and eligibility rules.
4. The old assignments remain in draft history.
5. The replacement assignments are appended to the same tournament history record.

This allows the redrawn participant's previous players to return to the available pool without allowing duplicates with other current squads.

## Important Limitations

The algorithm is random, duplicate-safe, and rating-aware, but it does not
perform global backtracking.

For example, a random early selection could consume a player who would have been useful for a later position. If the remaining database cannot satisfy a later slot, generation fails rather than retrying with a different earlier choice.

Possible future improvement:

- Add a constrained allocation planner that checks scarce positions first.
- Retry or backtrack when a random choice makes the remaining allocation impossible.

The current fail-safe behavior is intentional: it protects the tournament from invalid squads and duplicate assignments.

The fairness model also does not promise identical final averages. Participants
can have different position requirements, and some positions have fewer
eligible players. The algorithm prioritizes valid positions and uniqueness
before rating balance.
