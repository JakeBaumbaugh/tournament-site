import Song from "./Song";
import { TournamentLevel, TournamentRound } from "./Tournament";

export default class TournamentBuilder {
    name: string;
    songCount: number;
    matchesPerRound: number;
    spotifyPlaylist: string;
    songs: Song[];
    levels: TournamentLevel[];

    constructor() {
        this.name = "";
        this.songCount = 64;
        this.matchesPerRound = 8;
        this.spotifyPlaylist = "";
        this.songs = [];
        this.levels = this.buildLevels();
    }

    copy(): TournamentBuilder {
        const newBuilder = new TournamentBuilder();
        newBuilder.name = this.name;
        newBuilder.songCount = this.songCount;
        newBuilder.matchesPerRound = this.matchesPerRound;
        newBuilder.spotifyPlaylist = this.spotifyPlaylist;
        newBuilder.songs = this.songs;
        newBuilder.levels = this.levels;
        return newBuilder;
    }

    isValid(): boolean {
        // Check name
        if(!this.name) {
            console.log("Missing tournament name.");
            return false;
        }
        // Check song count
        if(this.songs.length !== this.songCount) {
            console.log("Incorrect song count.");
            return false;
        }
        // Check start/end date order
        const rounds = this.levels.flatMap(level => level.rounds);
        if(!rounds.every(round => round.startDate < round.endDate)) {
            console.log("Round end date must be after round start date.");
            return false;
        }
        return true;
    }

    setName(name: string): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.name = name;
        return newBuilder;
    }

    setSongCount(songCount: number): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.songCount = songCount;
        newBuilder.levels = newBuilder.buildLevels();
        return newBuilder;
    }

    setMatchesPerRound(matchesPerRound: number): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.matchesPerRound = matchesPerRound;
        newBuilder.levels = newBuilder.buildLevels();
        return newBuilder;
    }

    setSpotifyPlaylist(spotifyPlaylist: string): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.spotifyPlaylist = spotifyPlaylist;
        return newBuilder;
    }

    setSongs(songs: Song[]): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.songs = songs;
        return newBuilder;
    }

    addSong(song: Song): TournamentBuilder {
        const newBuilder = this.copy();
        newBuilder.songs = [...newBuilder.songs, song];
        return newBuilder;
    }

    removeSong(song: Song): TournamentBuilder {
        const newBuilder = this.copy();
        const index = newBuilder.songs.indexOf(song);
        newBuilder.songs = newBuilder.songs.toSpliced(index, 1);
        return newBuilder;
    }

    hasSong(song: Song): boolean {
        return this.songs.some(s => s.title === song.title && s.artist === song.artist);
    }

    buildLevels(): TournamentLevel[] {
        const date = new Date();
        date.setHours(24, 0, 0, 0);

        const levels: TournamentLevel[] = [];
        let levelNumber = 1;
        for(let songsInLevel = this.songCount; songsInLevel >= 2; songsInLevel /= 2) {
            const matchesInLevel = songsInLevel / 2;
            const roundsInLevel = Math.ceil(matchesInLevel / this.matchesPerRound);
            const rounds: TournamentRound[] = [];
            for(let roundIndex = 0; roundIndex < roundsInLevel; roundIndex++) {
                const startDate = new Date(date);
                date.setDate(date.getDate() + 1);
                const endDate = new Date(date);
                rounds.push(new TournamentRound(-1, startDate, endDate, []));
            }
            levels.push(new TournamentLevel(-1, `Level ${levelNumber}`, rounds));
            levelNumber++;
        }
        return levels;
    }

    setStartDate(date: Date): TournamentBuilder {
        const newBuilder = this.copy();
        const firstRound = newBuilder.levels[0].rounds[0];
        firstRound.startDate = date;
        return newBuilder;
    }

    setEndDate(date: Date, round: TournamentRound): TournamentBuilder {
        const newBuilder = this.copy();
        const rounds = newBuilder.levels.flatMap(level => level.rounds);
        const roundIndex = rounds.indexOf(round);
        rounds[roundIndex].endDate = date;
        if(roundIndex + 1 < rounds.length) {
            rounds[roundIndex + 1].startDate = date;
        }
        return newBuilder;
    }
}