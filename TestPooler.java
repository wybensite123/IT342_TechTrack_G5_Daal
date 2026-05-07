import java.sql.*;

public class TestPooler {
    static final String[] REGIONS = {
        "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
        "ap-south-1", "us-east-1", "us-west-1",
        "eu-west-1", "eu-central-1"
    };
    static final String PROJECT_REF = "bicgrfraxlqeklfmlwab";
    static final String PASSWORD = "Wybendaal123";

    public static void main(String[] args) throws Exception {
        for (String region : REGIONS) {
            String url = "jdbc:postgresql://aws-0-" + region + ".pooler.supabase.com:5432/postgres?sslmode=require";
            String user = "postgres." + PROJECT_REF;
            System.out.print("Testing " + region + "... ");
            try {
                Connection conn = DriverManager.getConnection(url, user, PASSWORD);
                System.out.println("SUCCESS! Region: " + region);
                conn.close();
                return;
            } catch (Exception e) {
                System.out.println("FAIL: " + e.getMessage().split("\n")[0]);
            }
        }
    }
}
