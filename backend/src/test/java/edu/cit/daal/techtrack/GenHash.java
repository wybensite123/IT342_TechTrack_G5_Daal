package edu.cit.daal.techtrack;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class GenHash {
    @Test
    void gen() {
        var enc = new BCryptPasswordEncoder();
        System.out.println("Admin@123 -> " + enc.encode("Admin@123"));
        System.out.println("User@123  -> " + enc.encode("User@123"));
    }
}
