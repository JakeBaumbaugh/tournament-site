package tournament.app;

import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tournament.model.Profile;
import tournament.service.ProfileService;

public class JwtTokenFilter extends OncePerRequestFilter {
    private static Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);

    private ProfileService profileService;

    public JwtTokenFilter(ProfileService profileService) {
        this.profileService = profileService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = getToken(request);
        logger.debug("Found Bearer token: {}", token);

        Payload payload = null;
        if(token != null) {
            payload = parseToken(token);
            logger.debug(payload != null ? payload.toPrettyString() : "Payload null.");
        }

        if (payload != null) {
            Profile profile = profileService.getProfileFromPayload(payload);
            Authentication auth = new PreAuthenticatedAuthenticationToken(profile, token);
            auth.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
    
    private String getToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if(authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private Payload parseToken(String jwt) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(List.of("809997101751-gca7bdfjfc8a7c3cftr6bqij1g3hdf5f.apps.googleusercontent.com"))
                    .build();
            GoogleIdToken idToken = verifier.verify(jwt);
            return idToken.getPayload();
        } catch (Exception e) {
            return null;
        }
    }
}