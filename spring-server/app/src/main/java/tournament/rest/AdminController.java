package tournament.rest;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import tournament.model.Profile;
import tournament.model.Tournament;
import tournament.rest.request.UploadImageRequestBody;
import tournament.service.ImageService;
import tournament.service.ProfileService;
import tournament.service.TournamentService;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    private TournamentService tournamentService;
    private ProfileService profileService;
    private ImageService imageService;

    @Autowired
    public AdminController(TournamentService tournamentService, ProfileService profileService, ImageService imageService) {
        this.tournamentService = tournamentService;
        this.profileService = profileService;
        this.imageService = imageService;
    }

    // Create random tournament for testing
    @GetMapping("/randomTournament")
    public Integer randomTournament(Authentication authentication, @RequestParam String name) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("GET request to generate a random tournament from user {}", profile.getName());

        requireAdmin(profile);

        return tournamentService.generateTournament(name).getId();
    }
    
    // Fill random vote counts for testing
    @GetMapping("/fillVoteCounts")
    public void fillVoteCounts(Authentication authentication, @RequestParam Integer tournamentId) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("GET request to fill vote counts for tournament {} from user {}", tournamentId, profile.getName());

        requireAdmin(profile);

        Tournament tournament = tournamentService.getTournament(tournamentId)
                .orElseThrow(() -> create400("Tournament not found."));
        
        tournamentService.fillVoteCounts(tournament);
    }

    // Get list of profiles for admin page
    @GetMapping("/profiles")
    public List<Profile> getProfiles(Authentication authentication) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("GET request to view all profiles from user {}", profile.getName());

        requireAdmin(profile);

        return profileService.getProfiles();
    }

    // Update profile data
    @PostMapping("/updateProfile")
    public Profile updateProfile(Authentication authentication, @RequestBody Profile profileToSave) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("POST request to save profile {} from user {}", profileToSave.getId(), profile.getName());

        requireAdmin(profile);

        return profileService.updateProfile(profileToSave).orElse(null);
    }

    // Delete profile
    @DeleteMapping("/deleteProfile")
    public void deleteProfile(Authentication authentication, @RequestParam Integer id) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("DELETE request to delete profile {} from user {}", id, profile.getName());

        requireAdmin(profile);

        profileService.deleteProfile(id);
    }
    
    // Upload image for tournament backgrounds
    @PostMapping("/uploadImage")
    public void uploadImage(Authentication authentication, @RequestBody UploadImageRequestBody body) {
        Profile profile = (Profile) authentication.getPrincipal();
        logger.info("POST request to upload an image from user {}", profile.getName());

        requireAdmin(profile);

        imageService.saveImage(body.getData());
    }

    private void requireAdmin(Profile profile) {
        if (!profile.isAdmin()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(403));
        }
    }

    private ResponseStatusException create400(String message) {
        return new ResponseStatusException(HttpStatusCode.valueOf(400), message);
    }
}
