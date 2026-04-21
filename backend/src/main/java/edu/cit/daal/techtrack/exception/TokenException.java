package edu.cit.daal.techtrack.exception;

import lombok.Getter;

@Getter
public class TokenException extends RuntimeException {

    private final String code;

    public TokenException(String code, String message) {
        super(message);
        this.code = code;
    }
}
