package edu.cit.daal.techtrack.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A single asset that a user has saved to their watchlist.
 * (user_id, asset_id) is unique — a user cannot watch the same asset twice.
 */
@Entity
@Table(
        name = "watchlist_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_watchlist_user_asset",
                columnNames = {"user_id", "asset_id"}
        ),
        indexes = {
                @Index(name = "idx_watchlist_user", columnList = "user_id"),
                @Index(name = "idx_watchlist_asset", columnList = "asset_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
