import { Moment } from "moment";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import DateTime from "react-datetime";
import { useNavigate } from "react-router-dom";
import VoterCard from "../card/VoterCard";
import { useLoadingScreenContext } from "../context/LoadingScreenContext";
import { useTournamentContext } from "../context/TournamentContext";
import TournamentPrivacyButtons from "../creation/TournamentPrivacyButtons";
import { Tournament } from "../model/Tournament";
import TournamentSettings from "../model/TournamentSettings";
import TournamentVoter from "../model/TournamentVoter";
import { deleteTournament, getTournamentSettings, saveTournamentSettings } from "../service/TournamentService";
import "./settings.css";

export default function TournamentSettingsPage() {
    const navigate = useNavigate();
    const {tournament} = useTournamentContext();
    const [, setLoading] = useLoadingScreenContext();
    const [settings, setSettings] = useState<TournamentSettings|null>();

    useEffect(() => {
        if(tournament?.id) {
            setLoading(true);
            getTournamentSettings(tournament.id)
                .then(settings => setSettings(settings))
                .then(() => setLoading(false));
        }
    }, [tournament?.id]);
  

    const onDelete = () => {
        // TODO: Modal confirmation
        if(tournament) {
            deleteTournament(tournament.id)
                .then(() => navigate("/"));
            // TODO: Display error if tournament delete failed
        }
    };

    const onSave = () => {
        if(settings) {
            saveTournamentSettings(settings)
                .then(() => navigate(tournament ? `/tournament?id=${tournament?.id}` : "/"));
        }
    };

    return (
        <main className="settings-page">
            {(tournament && settings) ? <>
                <CurrentVoterStatus tournament={tournament} settings={settings} />
                <SetupRoundDescriptions settings={settings} setSettings={setSettings} />
                <RoundDates settings={settings} setSettings={setSettings} />
                <VoterList tournament={tournament} settings={settings} setSettings={setSettings} />
                <h3>Tournament Privacy</h3>
                <TournamentPrivacyButtons value={settings.privacy} onSelect={privacy => setSettings(settings.setPrivacy(privacy))}/>
                <div className="button-row">
                    <Button onClick={onDelete} variant="danger">DELETE</Button>
                    <Button onClick={onSave}>SAVE</Button>
                </div>
            </> : <p>Tournament not found.</p>}
        </main>
    );
}

interface CurrentVoterStatusProps {
    tournament: Tournament;
    settings: TournamentSettings;
}

function CurrentVoterStatus({tournament, settings}: CurrentVoterStatusProps) {
    const votersWithProfiles = useMemo(() => settings?.voters.filter(voter => voter.profile) ?? [], [settings]);

    return ( tournament.getVotableRound() ? (
        <div className="voting-status">
            <h3>Current Voters</h3>
            <p>Has Voted:</p>
            <div className="voter-profiles">
                {votersWithProfiles?.filter(voter => voter.hasVoted).map(voter => (
                    <OverlayTrigger placement="right" key={voter.email} overlay={
                        <Tooltip id={`${voter.email}-tooltip`}>{voter.profile!.getName()}</Tooltip>
                    }>
                        <img src={voter.profile!.pictureLink}/>
                    </OverlayTrigger>
                ))}
            </div>
            <p>Has Not Voted:</p>
            <div className="voter-profiles">
                {votersWithProfiles?.filter(voter => voter.hasVoted === false).map(voter => (
                    <OverlayTrigger placement="right" key={voter.email} overlay={
                        <Tooltip id={`${voter.email}-tooltip`}>{voter.profile!.getName()}</Tooltip>
                    }>
                        <img src={voter.profile!.pictureLink}/>
                    </OverlayTrigger>
                ))}
            </div>
        </div>
    ) : <></>);
}

interface SetupRoundDescriptionsProps {
    settings: TournamentSettings;
    setSettings: Dispatch<SetStateAction<TournamentSettings|null|undefined>>;
}

function SetupRoundDescriptions({settings, setSettings}: SetupRoundDescriptionsProps) {
    const setRoundDescription = (value: string) =>
        setSettings(settings => settings!.setCurrentRoundDescription(value));
    const setMatchDescription = (value: string, matchIndex: number, entryIndex: number) =>
        setSettings(settings => settings!.setMatchDescription(value, matchIndex, entryIndex));

    return (
        <div className="round-descriptions">
            <h3>Manage Current Round Descriptions</h3>
            <label>Round Description</label>
            <textarea
                value={settings.currentRoundDescription}
                onChange={e => setRoundDescription(e.target.value)}
            />
            {settings.matchDescriptions.map((match, index) => <>
                <label>{match.entry1Line1}</label>
                <textarea
                    value={match.entry1Description}
                    onChange={e => setMatchDescription(e.target.value, index, 1)}
                />
                <label>{match.entry2Line1}</label>
                <textarea
                    value={match.entry2Description}
                    onChange={e => setMatchDescription(e.target.value, index, 2)}
                />
            </>)}
        </div>
    );
}

interface RoundDatesProps {
    settings: TournamentSettings;
    setSettings: Dispatch<SetStateAction<TournamentSettings|null|undefined>>;   
}

function RoundDates({settings, setSettings}: RoundDatesProps) {
    const setStartDate = (index: number, date: string | Moment) => {
        if(typeof date !== "string") {
            setSettings(settings => settings?.setRoundStartDate(index, date.toDate()));
        }
    };
    const setEndDate = (index: number, date: string | Moment) => {
        if(typeof date !== "string") {
            setSettings(settings => settings?.setRoundEndDate(index, date.toDate()));
        }
    };

    if (settings.roundDates === null) {
        return <></>;
    }

    return (
        <div className="round-dates-container">
            <h3>Manage Round Dates</h3>
            {settings.roundDates.map((roundDate, index) => (
                <div className="round-date" key={index}>
                    <DateTime 
                        value={roundDate.startDate}
                        onChange={date => setStartDate(index, date)}
                        closeOnSelect
                    />
                    <p>Round {index + 1}</p>
                    <DateTime 
                        value={roundDate.endDate}
                        onChange={date => setEndDate(index, date)}
                        closeOnSelect
                    />
                </div>
            ))}
        </div>
    );
}

interface VoterListProps {
    tournament: Tournament;
    settings: TournamentSettings;
    setSettings: Dispatch<SetStateAction<TournamentSettings|null|undefined>>;
}

function VoterList({tournament, settings, setSettings}: VoterListProps) {
    const [voterInput, setVoterInput] = useState("");

    const addVoter = () => {
        const email = voterInput.trim();
        if(email && settings && !settings.hasVoter(email)) {
            const voter = new TournamentVoter(tournament.id, email);
            setSettings(settings => settings!.addVoter(voter));
            setVoterInput("");
        }
    };
    const removeVoter = (voter: TournamentVoter) => setSettings(settings => settings!.removeVoter(voter));

    return (
        <div className="voter-settings">
            <h3>Manage Voters</h3>
            <input
                type="text"
                value={voterInput}
                onChange={e => setVoterInput(e.target.value)}
                placeholder="Enter voter email address..."
            />
            <button type="button" onClick={addVoter}>+</button>
            <div className="voter-list">
                {settings.voters.map(voter => (
                    <VoterCard
                        key={voter.email}
                        voter={voter}
                        onClick={() => removeVoter(voter)}
                        deletable
                    />
                ))}
            </div>
        </div>
    );
}