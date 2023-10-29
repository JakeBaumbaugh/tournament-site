package tournament.rest;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import tournament.model.Profile;
import tournament.model.Song;
import tournament.model.Tournament;
import tournament.model.TournamentBuilder;
import tournament.model.TournamentRound;
import tournament.model.TournamentSummary;
import tournament.rest.request.VoteRequestBody;
import tournament.service.TournamentService;

@RestController
public class TournamentController {
    private static final Logger logger = LoggerFactory.getLogger(TournamentController.class);

    private TournamentService tournamentService;

    @Autowired
    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }
    
    @GetMapping("/tournament")
    public Tournament get(@RequestParam(required = false) Integer id, @RequestParam(required = false) String name) {
        logger.info("GET request for tournament id={}, name={}", id, name);
        Optional<Tournament> tournament;
        if (id != null) {
            logger.info("Finding tournament by id {}", id);
            tournament = tournamentService.getTournament(id);
        } else {
            logger.info("Finding tournament by name {}", name);
            tournament = tournamentService.getTournament(name);
        }
        return tournament.orElseThrow(() -> create404("Tournament not found."));
    }

    @GetMapping("/tournaments")
    public List<TournamentSummary> get() {
        logger.info("GET request for all tournaments");
        return tournamentService.getTournaments();
    }

    @PostMapping("/tournament/vote")
    public void vote(Authentication authentication, @RequestBody VoteRequestBody body) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("POST request to vote on tournament id={} from user {}", body.getTournament(), profile.getName());

        Tournament tournament = tournamentService.getTournament(body.getTournament())
                .orElseThrow(() -> create400("Tournament not found."));
        TournamentRound activeRound = tournament.getVotableRound()
                .orElseThrow(() -> create400("Tournament does not have an active round."));
        List<Song> songs = tournamentService.getSongs(body.getSongs());
        if(!activeRound.validSongVotes(songs)) {
            throw create400("Songs did not match active round.");
        }

        tournamentService.vote(profile, activeRound, songs);
    }

    @GetMapping("/tournament/vote")
    public List<Integer> getVotedSongIds(Authentication authentication, @RequestParam Integer id) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("GET request for votes cast on tournament id={} from user {}", id, profile.getName());

        Tournament tournament = tournamentService.getTournament(id)
                .orElseThrow(() -> create400("Tournament not found."));
        TournamentRound activeRound = tournament.getVotableRound()
                .orElseThrow(() -> create400("Tournament does not have an active round."));
        
        return tournamentService.getVotedSongIds(profile, activeRound);
    }

    @GetMapping("/tournament/new")
    public Integer newTournament(@RequestParam String name) {
        logger.info("GET request to create a new sample tournament.");
        return tournamentService.generateTournament(name).getId();
    }

    @DeleteMapping("/tournament/delete")
    public void deleteTournament(Authentication authentication, @RequestParam Integer id) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("DELETE request to delete tournament id={} from user {}", id, profile.getName());

        Tournament tournament = tournamentService.getTournament(id)
                .orElseThrow(() -> create400("Tournament not found."));
        if(profile.canDeleteTournament(tournament)) {
            tournamentService.deleteTournament(id);
        }
    }

    @PostMapping("/tournament/create")
    public void createTournament(Authentication authentication, @RequestBody TournamentBuilder builder) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("POST request to create tournament {} from user {}", builder.getName(), profile.getName());

        if(profile.canCreateTournament()) {
            tournamentService.createTournament(builder);
        }
    }

    @GetMapping("/song/search")
    public List<Song> searchSongs(@RequestParam(required = false) String title, @RequestParam(required = false) String artist) {
        logger.info("GET request to search songs for title={} and artist={}", title, artist);
        return tournamentService.searchSongs(title, artist);
    }

    private ResponseStatusException create404(String message) {
        return new ResponseStatusException(HttpStatusCode.valueOf(404), message);
    }

    private ResponseStatusException create400(String message) {
        return new ResponseStatusException(HttpStatusCode.valueOf(400), message);
    }
}
