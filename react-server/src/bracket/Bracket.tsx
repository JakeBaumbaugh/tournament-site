import { Fragment, useMemo } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import EntryCard from "../card/EntryCard";
import { BracketEntry } from "../model/Entry";
import { Tournament, TournamentMatch } from "../model/Tournament";
import MatchConnectorColumn from "./MatchConnectorColumn";

interface BracketProps {
    tournament: Tournament;
}

export default function Bracket({tournament}: BracketProps) {
    const matches = useMemo(() => {
        const matches: (TournamentMatch|null)[][] = tournament.levels.map(level => level.rounds.flatMap(round => {
            const isActive = tournament.getVotableRound()?.id === round.id;
            round.matches.forEach(match => {
                match.entry1.activeRound = isActive;
                match.entry2.activeRound = isActive;
            });
            return round.matches;
        }));
        // Fill null matches for unfinished levels
        let expectedMatchCount = matches[0].length / 2;
        for(let levelIndex = 1; levelIndex < matches.length; levelIndex++) {
            const level = matches[levelIndex];
            if(level.length !== expectedMatchCount) {
                const extraNulls = Array(expectedMatchCount - level.length).fill(null);
                level.push(...extraNulls);
            }
            expectedMatchCount /= 2;
        }
        return matches;
    }, [tournament]);

    const entries: (BracketEntry|null)[][] = useMemo(() => {
        const entries = matches.map((level, levelIndex) =>
            level.flatMap((match, matchIndex) => {
                if(match) {
                    const entry1 = {...match.entry1} as BracketEntry;
                    const entry2 = {...match.entry2} as BracketEntry;
                    if(levelIndex > 0) {
                        const match1Index = matchIndex * 2;
                        const match2Index = matchIndex * 2 + 1;
                        const prevLevel = matches[levelIndex - 1];
                        entry1.parent1VoteCount = prevLevel[match1Index]?.entry1VoteCount;
                        entry1.parent2VoteCount = prevLevel[match1Index]?.entry2VoteCount;
                        entry2.parent1VoteCount = prevLevel[match2Index]?.entry1VoteCount;
                        entry2.parent2VoteCount = prevLevel[match2Index]?.entry2VoteCount;
                    }
                    entry1.receivedVoteCount = match.entry1VoteCount;
                    entry2.receivedVoteCount = match.entry2VoteCount;
                    const totalVoteCount = (match.entry1VoteCount ?? 0) + (match.entry2VoteCount ?? 0);
                    entry1.totalVoteCount = totalVoteCount;
                    entry2.totalVoteCount = totalVoteCount;
                    // Clear activeRound boolean on original entry object
                    match.entry1.activeRound = undefined;
                    match.entry2.activeRound = undefined;
                    return [entry1, entry2];
                } else {
                    return [null, null];
                }
            })
        );
        const lastMatch = matches.at(-1)![0];
        const entryWinner = lastMatch?.entryWinner as BracketEntry ?? null;
        if(entryWinner) {
            entryWinner.parent1VoteCount = lastMatch!.entry1VoteCount;
            entryWinner.parent2VoteCount = lastMatch!.entry2VoteCount;
        }
        entries.push([entryWinner]);
        return entries;
    }, [matches]);

    const entryColumns = useMemo(() => {
        const leftEntries: (BracketEntry|null)[][] = [];
        const rightEntries: (BracketEntry|null)[][] = [];
        entries.forEach(level => {
            if(level.length > 1) {
                const halfLength = level.length / 2;
                leftEntries.push(level.slice(0, halfLength));
                rightEntries.push(level.slice(halfLength));
            }
        });
        const finalEntry = entries.at(-1)![0];
        return [...leftEntries, [finalEntry], ...(rightEntries.toReversed())];
    }, [entries]);

    return entryColumns ? (
        <TransformWrapper minScale={0.5} maxScale={2}>
            <TransformComponent>
                <div className="bracket">
                    {entryColumns.map((entries, index) => <Fragment key={`column-${index}`}>
                        {index > 0 && <MatchConnectorColumn left={entryColumns[index-1].length} right={entries.length}/>}
                        <div className={index < entryColumns.length / 2 ? "column left-column" : "column right-column"}>
                            {entries.map(entry =>
                                <EntryCard
                                    entry={entry}
                                    final={index == (entryColumns.length - 1) / 2}
                                    key={`${index}-${entry?.line1}-${entry?.line2}`}
                                />
                            )}
                        </div>
                    </Fragment>)}
                </div>
            </TransformComponent>
        </TransformWrapper>
    ) : <></>;
}