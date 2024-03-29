import { Moment } from "moment";
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody } from "react-bootstrap";
import DateTime from "react-datetime";
import { useNavigate } from "react-router-dom";
import SongCard from "../card/SongCard";
import Song from "../model/Song";
import { TournamentRound } from "../model/Tournament";
import TournamentBuilder from "../model/TournamentBuilder";
import { getImageList, imageUrl } from "../service/ImageService";
import { createTournament, searchSongs } from "../service/TournamentService";
import TournamentModeButtons from "./TournamentModeButtons";
import TournamentPrivacyButtons from "./TournamentPrivacyButtons";
import "./tournament-creation.css";
import ImageSelectionModal from "./ImageSelectionModal";

export default function TournamentCreationPage() {
    const [builder, setBuilder] = useState(new TournamentBuilder());
    const [page, setPage] = useState(0);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const valid = useMemo(() => builder.isValid(), [builder]);

    const handleSubmit = (e: FormEvent) => {
        setSaving(true);
        e.preventDefault();
        if(valid) {
            console.log("submitting", builder);
            createTournament(builder)
                .then(() => navigate("/"));
        }
    };

    let content: JSX.Element;
    switch(page) {
        case 0:
            content = <SetupPage builder={builder} setBuilder={setBuilder}/>;
            break;
        case 1:
            content = <SongSelectPage builder={builder} setBuilder={setBuilder}/>;
            break;
        case 2:
            content = <SchedulePage builder={builder} setBuilder={setBuilder}/>;
            break;
        default:
            content = <p>Invalid Page</p>;
            break;
    }

    return (
        <main className="creation-page">
            <form onSubmit={handleSubmit}>
                {content}
                <div className="button-row">
                    <Button
                        type="button"
                        onClick={() => setPage(page => page - 1)}
                        disabled={page <= 0}
                    >BACK</Button>
                    {page === 2 ? (
                        <Button
                        type="submit"
                        key="submit-button"
                        variant={valid ? "success" : "danger"}
                        disabled={saving || !valid}
                    >SUBMIT</Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => setPage(page => page + 1)}
                            key="next-button"
                        >NEXT</Button>
                    )}
                </div>
            </form>
        </main>
    );
}

interface PageProps {
    builder: TournamentBuilder;
    setBuilder: Dispatch<SetStateAction<TournamentBuilder>>;
}

function SetupPage({builder, setBuilder}: PageProps) {
    const [imageIds, setImageIds] = useState<number[]>([]);
    const [showImageSelectionModal, setShowImageSelectionModal] = useState(false);

    useEffect(() => {
        getImageList()
            .then(ids => setImageIds(ids));
    }, []);

    return (
        <div className="setup">
            <label>
                <span>Tournament Name</span>
                <input
                    type="text"
                    value={builder.name}
                    onChange={e => setBuilder(builder.setName(e.target.value))}
                />
            </label>
            <label>
                <span>Song Count</span>
                <select value={builder.songCount} onChange={e => setBuilder(builder.setSongCount(parseInt(e.target.value)))}>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="16">16</option>
                    <option value="32">32</option>
                    <option value="64">64</option>
                    <option value="128">128</option>
                </select>
            </label>
            <label>
                <span>Maximum Matches per Round</span>
                <select value={builder.matchesPerRound} onChange={e => setBuilder(builder.setMatchesPerRound(parseInt(e.target.value)))}>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="16">16</option>
                </select>
            </label>
            <label>
                <span>Spotify Playlist</span>
                <input
                    type="text"
                    value={builder.spotifyPlaylist}
                    onChange={e => setBuilder(builder.setSpotifyPlaylist(e.target.value))}
                />
            </label>
            <TournamentModeButtons value={builder.mode} onSelect={mode => setBuilder(builder.setMode(mode))} />
            <TournamentPrivacyButtons value={builder.privacy} onSelect={privacy => setBuilder(builder.setPrivacy(privacy))} />
            <ImageSelectionModal
                show={showImageSelectionModal}
                onHide={() => setShowImageSelectionModal(false)}
                imageList={imageIds}
                image={1}
                onSelect={id => {
                    setBuilder(builder.setBackgroundImage(id));
                    setShowImageSelectionModal(false);
                }}
            />
            <div className="background-image-details">
                <Button onClick={() => setShowImageSelectionModal(true)}>Select Background Image</Button>
                {builder.backgroundImage && <img src={imageUrl(builder.backgroundImage)} alt=""/>}
            </div>
        </div>
    );
}

function SongSelectPage({builder, setBuilder}: PageProps) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [spotify, setSpotify] = useState("");
    const [youtube, setYoutube] = useState("");
    const [suggestions, setSuggestions] = useState<Song[]>([]);

    useEffect(() => {
        // get suggestions
        refreshSuggestions(builder);
        // filter out already selected songs by id
        // maybe set a timer to only retrieve suggestions after a pause between typing
    }, [title, artist]);

    const refreshSuggestions = (builder: TournamentBuilder) => {
        if(title || artist) {
            searchSongs(title, artist)
                .then(suggestions => {
                    suggestions = suggestions.filter(song => !builder.hasSong(song));
                    setSuggestions(suggestions);
                });
        } else {
            setSuggestions([]);
        }
    };

    const addNewSong = () => {
        const trimmedTitle = title.trim();
        const trimmedArtist = artist.trim();
        const trimmedSpotify = spotify.trim();
        const trimmedYoutube = youtube.trim();
        const song: Song = {
            id: -1,
            title: trimmedTitle,
            artist: trimmedArtist,
            spotify: trimmedSpotify !== "" ? trimmedSpotify : undefined,
            youtube: trimmedYoutube !== "" ? trimmedYoutube : undefined
        };
        if(trimmedTitle && trimmedArtist) {
            addSong(song);
        }
    };

    const addSong = (song: Song) => {
        if(builder.songs.length < builder.songCount && !builder.hasSong(song)) {
            setBuilder(builder.addSong(song));
            setTitle("");
            setArtist("");
            setSpotify("");
            setYoutube("");
        }
    };

    const removeSong = (song: Song) => {
        setBuilder(builder => {
            builder = builder.removeSong(song);
            refreshSuggestions(builder);
            return builder;
        });
    };

    return (
        <div className="song-select">
            <div className="song-input">
                <div className="song-fields">
                    <label>
                        <span>Title</span>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}/>
                    </label>
                    <label>
                        <span>Artist</span>
                        <input type="text" value={artist} onChange={e => setArtist(e.target.value)}/>
                    </label>
                    <label>
                        <span>Spotify Link</span>
                        <input type="text" value={spotify} onChange={e => setSpotify(e.target.value)}/>
                    </label>
                    <label>
                        <span>Youtube Link</span>
                        <input type="text" value={youtube} onChange={e => setYoutube(e.target.value)}/>
                    </label>
                </div>
                <button type="button" onClick={addNewSong}>+</button>
                <div className="song-suggestions">
                    <p>Suggestions:</p>
                    {suggestions.length > 0 ? suggestions.map(song => (
                        <SongCard
                            key={`${song.id}-${song.title}-${song.artist}`}
                            song={song}
                            onClick={() => addSong(song)}
                            selectable
                        />
                    )) : (title || artist) ? <p>No existing songs found.</p> : <p>Enter title or artist to see suggestions.</p>}
                </div>
            </div>
            <div className="song-collection">
                <p>Selected Songs ({builder.songs.length}/{builder.songCount}):</p>
                {builder.songs.map(song => (
                    <SongCard 
                        key={`${song.title}-${song.artist}`}
                        song={song}
                        onClick={() => removeSong(song)}
                        deletable
                    />
                ))}
            </div>
        </div>
    );
}

function SchedulePage({builder, setBuilder}: PageProps) {
    const firstRound = builder.levels[0].rounds[0];
    const disabled = builder.mode === "INSTANT";
    const cardClassName = "disabled-message" + (disabled ? "" : " hidden");

    const setStartDate = (value: string | Moment) => {
        if(typeof value !== "string") {
            setBuilder(builder.setStartDate(value.toDate()));
        }
    };

    const setEndDate = (value: string | Moment, round: TournamentRound) => {
        if(typeof value !== "string") {
            setBuilder(builder.setEndDate(value.toDate(), round));
        }
    };

    return (
        <div className="bracket-schedule">
            <DateTime 
                value={firstRound.startDate!}
                onChange={setStartDate}
                closeOnSelect
                inputProps={{disabled}}
            />
            {builder.levels.map(level => <div key={level.name}>
                {level.rounds.map((round, index) => <>
                    <p>{level.name}, Round {index + 1}</p>
                    <DateTime
                        value={round.endDate!}
                        onChange={value => setEndDate(value, round)}
                        closeOnSelect
                        inputProps={{disabled}}
                    />
                </>)}
            </div>)}
            <Card className={cardClassName}>
                <CardBody>
                    This page is disabled for INSTANT mode tournaments.
                </CardBody>
            </Card>
        </div>
    );
}