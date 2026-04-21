package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.UserProvider;
import edu.cit.daal.techtrack.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProviderRepository extends JpaRepository<UserProvider, Long> {

    Optional<UserProvider> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);
}
