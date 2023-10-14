import { Tournament } from "../model/Tournament";
import TournamentSummary from "../model/TournamentSummary";
import { get, post } from "./ServiceUtil";

export function getTournament(id: number): Promise<Tournament|undefined> {
    return get(`/tournament?id=${id}`)
        .then(res => res.json())
        .then(res => Tournament.fromJson(res))
        .catch(() => {
            console.log("Failed to retrieve tournament.");
            return undefined;
        });
}

export function getTournaments(): Promise<TournamentSummary[]> {
    return get("/tournaments")
        .then(res => res.json())
        .then(res => res.map(TournamentSummary.fromJson))
        .catch(() => {
            console.log("Failed to retrieve tournaments.");
            return [];
        });
}

export function submitVote(jwt: string, tournamentId: number, songIds: number[]): Promise<Response> {
    return post("/tournament/vote", jwt, {
        tournament: tournamentId,
        songs: songIds
    });
}

export function getVotes(jwt: string, tournamentId: number): Promise<number[]> {
    return get(`/tournament/vote?id=${tournamentId}`, jwt)
        .then(res => res.json())
        .catch(() => {
            console.log("Failed to retrieve votes.");
            return [];
        });
}