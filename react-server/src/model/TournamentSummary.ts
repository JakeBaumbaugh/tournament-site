import Song from "./Song";

export default class TournamentSummary {
    id: number;
    name: string;
    startDate: Date;
    endDate?: Date;
    songWinner?: Song;
    votingEndDate?: Date;

    constructor(id: number, name: string, startDate: Date, endDate?: Date, songWinner?: Song, votingEndDate?: Date) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.songWinner = songWinner;
        this.votingEndDate = votingEndDate;
    }

    static fromJson(data: any): TournamentSummary {
        const startDate = new Date(data.startDate);
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        const votingEndDate = data.votingEndDate ? new Date(data.votingEndDate) : undefined;
        return new TournamentSummary(data.id, data.name, startDate, endDate, data.songWinner, votingEndDate);
    }
}