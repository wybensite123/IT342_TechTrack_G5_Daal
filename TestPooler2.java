import java.sql.*;

public class TestPooler2 {
    static final String PROJECT_REF = "bicgrfraxlqeklfmlwab";
    static final String PASSWORD = "Wybendaal123";

    public static void main(String[] args) throws Exception {
        String[] regions = {"ap-southeast-1", "ap-northeast-1", "us-east-1"};
        String[] users = {"postgres." + PROJECT_REF, "postgres", "postgres." + PROJECT_REF.toLowerCase()};
        int[] ports = {5432, 6543};

        for (String region : regions) {
            for (int port : ports) {
                for (String user : users) {
                    String url = "jdbc:postgresql://aws-0-" + region + ".pooler.supabase.com:" + port + "/postgres?sslmode=require&connectTimeout=5";
                    System.out.print("[" + region + ":" + port + " user=" + user + "] ");
                    try {
                        Connection conn = DriverManager.getConnection(url, user, PASSWORD);
                        System.out.println("SUCCESS!");
                        conn.close();
                        return;
                    } catch (Exception e) {
                        System.out.println("FAIL: " + e.getMessage().split("\n")[0]);
                    }
                }
            }
        }
    }
}
