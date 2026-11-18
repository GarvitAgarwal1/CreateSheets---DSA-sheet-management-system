package com.iqms.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PlatformStatsService {
  private static final String USER_AGENT = "CreateSheets/1.0 (+https://create-sheets.local)";
  private static final List<PlatformDefinition> PLATFORM_DEFINITIONS = List.of(
      new PlatformDefinition("leetcode", "LeetCode", "LC", "https://leetcode.com/u/", "https://leetcode.com/u/{username}/", "About / name", "Put the verification code in your public LeetCode real name or about section.", true, "core", "graphql_public"),
      new PlatformDefinition("codeforces", "Codeforces", "CF", "https://codeforces.com/profile/", "https://codeforces.com/profile/{username}", "About / profile text", "Put the verification code in your public Codeforces about section or visible profile text.", true, "core", "official_api"),
      new PlatformDefinition("codechef", "CodeChef", "CC", "https://www.codechef.com/users/", "https://www.codechef.com/users/{username}", "Profile text", "Put the verification code in a visible CodeChef profile field, then verify.", true, "best_effort", "community_api"),
      new PlatformDefinition("atcoder", "AtCoder", "AC", "https://atcoder.jp/users/", "https://atcoder.jp/users/{username}", "Public profile text", "Put the verification code in a visible AtCoder public profile field if your profile allows it.", true, "best_effort", "unofficial_api"),
      new PlatformDefinition("hackerrank", "HackerRank", "HR", "https://www.hackerrank.com/profile/", "https://www.hackerrank.com/profile/{username}", "Name / bio", "Put the verification code in your HackerRank name or bio.", true, "best_effort", "undocumented_public_api"),
      new PlatformDefinition("hackerearth", "HackerEarth", "HE", "https://www.hackerearth.com/@", "https://www.hackerearth.com/@{username}/", "Public profile text", "Put the verification code in visible HackerEarth profile text.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("topcoder", "Topcoder", "TC", "https://www.topcoder.com/members/", "https://www.topcoder.com/members/{username}", "Public profile text", "Put the verification code in visible Topcoder profile text.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("spoj", "SPOJ", "SP", "https://www.spoj.com/users/", "https://www.spoj.com/users/{username}/", "Public profile text", "Put the verification code in visible SPOJ profile text.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("kattis", "Kattis", "KT", "https://open.kattis.com/users/", "https://open.kattis.com/users/{username}", "Public profile text", "Put the verification code in visible Kattis profile text.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("cses", "CSES", "CS", "https://cses.fi/user/", "https://cses.fi/user/{username}", "Not available", "CSES does not expose public per-user profiles that can be strictly verified.", false, "unavailable", "none"),
      new PlatformDefinition("codewars", "Codewars", "CW", "https://www.codewars.com/users/", "https://www.codewars.com/users/{username}", "Name / profile text", "Put the verification code in your public Codewars name or profile text.", true, "core", "official_api"),
      new PlatformDefinition("exercism", "Exercism", "EX", "https://exercism.org/profiles/", "https://exercism.org/profiles/{username}", "Bio / profile text", "Put the verification code in visible Exercism profile text.", true, "core", "official_api"),
      new PlatformDefinition("codesignal", "CodeSignal", "CSG", "https://app.codesignal.com/profile/", "https://app.codesignal.com/profile/{username}", "Public profile text", "Put the verification code in visible CodeSignal profile text if the profile is public.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("codingame", "CodinGame", "CG", "https://www.codingame.com/profile/", "https://www.codingame.com/profile/{username}", "Public profile text", "Put the verification code in visible CodinGame profile text if the profile is public.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("dmoj", "DMOJ", "DM", "https://dmoj.ca/user/", "https://dmoj.ca/user/{username}", "Public profile text", "Put the verification code in visible DMOJ profile text.", true, "best_effort", "html_scrape"),
      new PlatformDefinition("github", "GitHub", "GH", "https://github.com/", "https://github.com/{username}", "Name / bio", "Put the verification code in your public GitHub name, bio, company, location, or website field.", true, "core", "official_api")
  );

  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  public PlatformStatsService(RestTemplate restTemplate, ObjectMapper objectMapper) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
  }

  public List<Map<String, Object>> platformCatalog() {
    return PLATFORM_DEFINITIONS.stream().map(this::definitionPayload).toList();
  }

  public PlatformDefinition definitionFor(String platform) {
    String normalized = normalizePlatform(platform);
    return PLATFORM_DEFINITIONS.stream()
        .filter(definition -> definition.key().equals(normalized))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unsupported platform."));
  }

  public Map<String, Object> fetchStats(String platform, String username) {
    String normalizedPlatform = normalizePlatform(platform);
    String trimmed = normalizeUsername(username);
    String encoded = encode(trimmed);

    try {
      return switch (normalizedPlatform) {
        case "leetcode" -> fetchLeetCode(trimmed);
        case "codeforces" -> fetchCodeforces(encoded);
        case "codechef" -> fetchCodeChef(encoded);
        case "atcoder" -> fetchAtCoder(encoded);
        case "hackerrank" -> fetchHackerRank(encoded);
        case "hackerearth" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://www.hackerearth.com/@" + encoded + "/", "([0-9,]+)\\s*(?:Problems\\s+Solved|problems\\s+solved)", "Parsed from HackerEarth public profile HTML.");
        case "topcoder" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://www.topcoder.com/members/" + encoded, "([0-9,]+)\\s*(?:challenges|submissions|wins|rating)", "Best-effort parse from Topcoder public profile.");
        case "spoj" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://www.spoj.com/users/" + encoded + "/", "Problems solved:\\s*<[^>]*>\\s*([0-9,]+)", "Parsed from SPOJ public profile HTML.");
        case "kattis" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://open.kattis.com/users/" + encoded, "([0-9,]+)\\s*(?:problems\\s+solved|Solved)", "Best-effort parse from Kattis public profile.");
        case "cses" -> unavailableStats(normalizedPlatform, trimmed, "CSES does not expose public per-user stats.");
        case "codewars" -> fetchCodewars(encoded);
        case "exercism" -> fetchExercism(encoded);
        case "codesignal" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://app.codesignal.com/profile/" + encoded, "([0-9,]+)\\s*(?:solved|tasks|challenges)", "Best-effort parse from public CodeSignal profile.");
        case "codingame" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://www.codingame.com/profile/" + encoded, "([0-9,]+)\\s*(?:puzzles|clashes|rank)", "Best-effort parse from public CodinGame profile.");
        case "dmoj" -> fetchRegexHtml(normalizedPlatform, trimmed, "https://dmoj.ca/user/" + encoded, "([0-9,]+)\\s*problems?\\s*solved", "Parsed from DMOJ public profile HTML.");
        case "github" -> fetchGithub(encoded);
        default -> unavailableStats(normalizedPlatform, trimmed, "Live API integration is not configured for this platform yet.");
      };
    } catch (Exception ex) {
      throw new RuntimeException("Unable to fetch " + normalizedPlatform + " stats.", ex);
    }
  }

  public VerificationProbe fetchVerificationProbe(String platform, String username) {
    PlatformDefinition definition = definitionFor(platform);
    String normalizedPlatform = definition.key();
    String trimmed = normalizeUsername(username);
    String encoded = encode(trimmed);

    if (!definition.strictVerificationPossible()) {
      return new VerificationProbe(false, "", definition.verificationInstructions());
    }

    try {
      String text = switch (normalizedPlatform) {
        case "leetcode" -> fetchLeetCodeVerificationText(trimmed);
        case "github" -> fetchGithubVerificationText(encoded);
        case "codeforces" -> fetchCodeforcesVerificationText(encoded);
        case "codechef" -> jsonAndHtmlText("https://codechef-api.vercel.app/handle/" + encoded, "https://www.codechef.com/users/" + encoded);
        case "hackerrank" -> jsonAndHtmlText("https://www.hackerrank.com/rest/contests/master/hackers/" + encoded + "/profile", "https://www.hackerrank.com/profile/" + encoded);
        case "codewars" -> jsonAndHtmlText("https://www.codewars.com/api/v1/users/" + encoded, "https://www.codewars.com/users/" + encoded);
        case "atcoder" -> publicHtmlText("https://atcoder.jp/users/" + encoded);
        case "hackerearth" -> publicHtmlText("https://www.hackerearth.com/@" + encoded + "/");
        case "topcoder" -> publicHtmlText("https://www.topcoder.com/members/" + encoded);
        case "spoj" -> publicHtmlText("https://www.spoj.com/users/" + encoded + "/");
        case "kattis" -> publicHtmlText("https://open.kattis.com/users/" + encoded);
        case "exercism" -> publicHtmlText("https://exercism.org/profiles/" + encoded);
        case "codesignal" -> publicHtmlText("https://app.codesignal.com/profile/" + encoded);
        case "codingame" -> publicHtmlText("https://www.codingame.com/profile/" + encoded);
        case "dmoj" -> publicHtmlText("https://dmoj.ca/user/" + encoded);
        default -> publicHtmlText(definition.profileUrl(trimmed));
      };
      return new VerificationProbe(true, text, "Public profile fetched.");
    } catch (Exception ex) {
      return new VerificationProbe(true, "", "Could not read the public profile right now: " + ex.getMessage());
    }
  }

  public Map<String, Object> definitionPayload(PlatformDefinition definition) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("key", definition.key());
    payload.put("label", definition.label());
    payload.put("shortLabel", definition.shortLabel());
    payload.put("profilePrefix", definition.profilePrefix());
    payload.put("profileUrlTemplate", definition.profileUrlTemplate());
    payload.put("verificationTarget", definition.verificationTarget());
    payload.put("verificationInstructions", definition.verificationInstructions());
    payload.put("strictVerificationPossible", definition.strictVerificationPossible());
    payload.put("reliabilityTier", definition.reliabilityTier());
    payload.put("statsSource", definition.statsSource());
    return payload;
  }

  private Map<String, Object> fetchLeetCode(String user) throws Exception {
    Map<String, Object> stats = baseStats("leetcode", user);
    JsonNode accepted = postGraphQl(
        "https://leetcode.com/graphql",
        "query userProfileUserQuestionProgressV2($userSlug: String!) { userProfileUserQuestionProgressV2(userSlug: $userSlug) { numAcceptedQuestions { difficulty count } } }",
        Map.of("userSlug", user))
        .path("data")
        .path("userProfileUserQuestionProgressV2")
        .path("numAcceptedQuestions");

    Map<String, Integer> difficulty = difficultyMap();
    int total = 0;
    for (JsonNode item : accepted) {
      int count = item.path("count").asInt(0);
      total += count;
      String key = item.path("difficulty").asText("unknown").toLowerCase();
      if (difficulty.containsKey(key)) difficulty.put(key, count);
    }
    stats.put("totalSolved", total);
    stats.put("difficulty", difficulty);
    stats.put("note", "Solved from accepted-question breakdown.");

    try {
      JsonNode calendar = postGraphQl(
          "https://leetcode.com/graphql",
          "query userProfileCalendar($username: String!, $year: Int) { userProfileCalendar(username: $username, year: $year) { submissionCalendar } }",
          Map.of("username", user, "year", Year.now().getValue()))
          .path("data").path("userProfileCalendar").path("submissionCalendar");
      stats.put("activity", calendarActivity(calendar.asText("")));
    } catch (Exception ignored) {
      stats.put("activity", List.of());
    }

    try {
      JsonNode contests = postGraphQl(
          "https://leetcode.com/graphql",
          "query userContestRankingInfo($username: String!) { userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage } userContestRankingHistory(username: $username) { attended rating contest { title startTime } } }",
          Map.of("username", user))
          .path("data");
      JsonNode ranking = contests.path("userContestRanking");
      stats.put("contests", ranking.path("attendedContestsCount").asInt(0));
      stats.put("rating", Math.round(ranking.path("rating").asDouble(0)));
      stats.put("rank", ranking.path("globalRanking").asText(""));
      stats.put("ratingHistory", ratingHistoryFromLeetCode(contests.path("userContestRankingHistory")));
    } catch (Exception ignored) {
      stats.put("contests", 0);
      stats.put("ratingHistory", List.of());
    }
    return stats;
  }

  private Map<String, Object> fetchCodeforces(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("codeforces", user);
    JsonNode status = getJson("https://codeforces.com/api/user.status?handle=" + encoded + "&from=1&count=10000");
    JsonNode rating = getJson("https://codeforces.com/api/user.rating?handle=" + encoded);
    JsonNode info = getJson("https://codeforces.com/api/user.info?handles=" + encoded);
    Set<String> solved = new HashSet<>();
    Map<String, Integer> difficulty = difficultyMap();
    Map<String, Integer> activity = new HashMap<>();
    Map<String, Integer> topics = new HashMap<>();
    for (JsonNode submission : status.path("result")) {
      if (!"OK".equals(submission.path("verdict").asText())) continue;
      JsonNode problem = submission.path("problem");
      String key = problem.path("contestId").asText() + "-" + problem.path("index").asText();
      if (!solved.add(key)) continue;
      int problemRating = problem.path("rating").asInt(0);
      if (problemRating <= 0) difficulty.put("unknown", difficulty.get("unknown") + 1);
      else if (problemRating <= 1200) difficulty.put("easy", difficulty.get("easy") + 1);
      else if (problemRating <= 2200) difficulty.put("medium", difficulty.get("medium") + 1);
      else difficulty.put("hard", difficulty.get("hard") + 1);
      String day = epochDay(submission.path("creationTimeSeconds").asLong(0));
      activity.put(day, activity.getOrDefault(day, 0) + 1);
      for (JsonNode tag : problem.path("tags")) {
        String label = tag.asText("").trim();
        if (!label.isBlank()) topics.put(label, topics.getOrDefault(label, 0) + 1);
      }
    }
    JsonNode first = info.path("result").isArray() && info.path("result").size() > 0 ? info.path("result").get(0) : null;
    stats.put("totalSolved", solved.size());
    stats.put("difficulty", difficulty);
    stats.put("activity", activityList(activity));
    stats.put("topics", topicList(topics));
    stats.put("contests", rating.path("result").size());
    stats.put("rating", first == null ? null : nullableInt(first, "rating"));
    stats.put("rank", first == null ? "" : first.path("rank").asText(""));
    stats.put("ratingHistory", ratingHistoryFromCodeforces(rating.path("result")));
    stats.put("note", "Solved count uses unique accepted Codeforces problems.");
    return stats;
  }

  private Map<String, Object> fetchCodeChef(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("codechef", user);
    JsonNode data = getJson("https://codechef-api.vercel.app/handle/" + encoded);
    JsonNode solved = data.path("solvedByDifficulty").path("totalCount");
    if (solved.isMissingNode() || solved.isNull()) solved = data.path("fullySolved").path("count");
    stats.put("totalSolved", solved.isNumber() ? solved.asInt() : null);
    stats.put("rating", nullableInt(data, "currentRating"));
    stats.put("rank", data.path("stars").asText(data.path("globalRank").asText("")));
    stats.put("difficulty", difficultyFromNode(data.path("solvedByDifficulty")));
    stats.put("note", "Fetched from the public community CodeChef API.");
    return stats;
  }

  private Map<String, Object> fetchAtCoder(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("atcoder", user);
    JsonNode submissions = getJson("https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=" + encoded + "&from_second=0");
    JsonNode rank = getJson("https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=" + encoded);
    Set<String> solved = new LinkedHashSet<>();
    Map<String, Integer> activity = new HashMap<>();
    for (JsonNode submission : submissions) {
      if (!"AC".equals(submission.path("result").asText())) continue;
      if (solved.add(submission.path("problem_id").asText())) {
        String day = epochDay(submission.path("epoch_second").asLong(0));
        activity.put(day, activity.getOrDefault(day, 0) + 1);
      }
    }
    stats.put("totalSolved", solved.size());
    stats.put("activity", activityList(activity));
    stats.put("rank", rank.path("rank").asText("N/A"));
    stats.put("note", "Accepted problems counted from AtCoderProblems submissions.");
    return stats;
  }

  private Map<String, Object> fetchHackerRank(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("hackerrank", user);
    JsonNode data = getJson("https://www.hackerrank.com/rest/contests/master/hackers/" + encoded + "/profile");
    int solved = data.path("model").path("solved_challenges").asInt(data.path("model").path("solved_challenge_count").asInt(0));
    stats.put("totalSolved", solved);
    stats.put("rank", data.path("model").path("rank").asText(""));
    stats.put("note", "Fetched from HackerRank public profile endpoint.");
    return stats;
  }

  private Map<String, Object> fetchCodewars(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("codewars", user);
    JsonNode data = getJson("https://www.codewars.com/api/v1/users/" + encoded);
    stats.put("totalSolved", data.path("codeChallenges").path("totalCompleted").asInt(0));
    stats.put("rank", data.path("ranks").path("overall").path("name").asText("Unknown"));
    stats.put("rating", data.path("honor").asInt(0));
    stats.put("note", "Total completed kata from Codewars public API.");
    return stats;
  }

  private Map<String, Object> fetchExercism(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("exercism", user);
    JsonNode data = getJson("https://exercism.org/api/v2/profiles/" + encoded + "/solutions");
    JsonNode list = data.path("solutions").isArray() ? data.path("solutions") : data.path("results");
    stats.put("totalSolved", list.isArray() ? list.size() : 0);
    stats.put("note", "Counted from public Exercism profile solutions.");
    return stats;
  }

  private Map<String, Object> fetchGithub(String encoded) throws Exception {
    String user = decodeForPayload(encoded);
    Map<String, Object> stats = baseStats("github", user);
    JsonNode profile = getJson("https://api.github.com/users/" + encoded);
    JsonNode events = getJson("https://api.github.com/users/" + encoded + "/events/public?per_page=100");
    int commits = 0;
    int prs = 0;
    int issues = 0;
    Map<String, Integer> activity = new HashMap<>();
    for (JsonNode event : events) {
      String type = event.path("type").asText();
      String day = event.path("created_at").asText("").length() >= 10 ? event.path("created_at").asText().substring(0, 10) : "";
      if ("PushEvent".equals(type)) {
        int pushCommits = event.path("payload").path("commits").size();
        commits += pushCommits;
        if (!day.isBlank()) activity.put(day, activity.getOrDefault(day, 0) + pushCommits);
      } else if ("PullRequestEvent".equals(type)) {
        prs++;
      } else if ("IssuesEvent".equals(type)) {
        issues++;
      }
    }
    stats.put("totalSolved", commits);
    stats.put("activity", activityList(activity));
    stats.put("topics", topicList(Map.of("Commits", commits, "Pull Requests", prs, "Issues", issues)));
    stats.put("commits", commits);
    stats.put("pullRequests", prs);
    stats.put("issues", issues);
    stats.put("rank", profile.path("followers").asInt(0) + " followers");
    stats.put("note", "Recent public GitHub activity from the events API.");
    return stats;
  }

  private Map<String, Object> fetchRegexHtml(String platform, String username, String url, String regex, String note) {
    Map<String, Object> stats = baseStats(platform, username);
    String html = getText(url);
    Matcher matcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(html == null ? "" : html);
    Integer total = matcher.find() ? Integer.valueOf(matcher.group(1).replace(",", "")) : null;
    stats.put("totalSolved", total);
    stats.put("note", total == null ? note + " No numeric solved count was found." : note);
    return stats;
  }

  private Map<String, Object> unavailableStats(String platform, String username, String note) {
    Map<String, Object> stats = baseStats(platform, username);
    stats.put("totalSolved", null);
    stats.put("note", note);
    return stats;
  }

  private Map<String, Object> baseStats(String platform, String username) {
    PlatformDefinition definition = definitionFor(platform);
    Map<String, Object> stats = new LinkedHashMap<>();
    stats.put("platform", definition.key());
    stats.put("platformLabel", definition.label());
    stats.put("username", username);
    stats.put("profileUrl", definition.profileUrl(username));
    stats.put("totalSolved", 0);
    stats.put("difficulty", difficultyMap());
    stats.put("activity", List.of());
    stats.put("topics", List.of());
    stats.put("ratingHistory", List.of());
    stats.put("contests", 0);
    stats.put("rating", null);
    stats.put("rank", "");
    stats.put("note", "");
    stats.put("fetchedAt", Instant.now().toString());
    return stats;
  }

  private String fetchLeetCodeVerificationText(String username) throws Exception {
    JsonNode data = postGraphQl(
        "https://leetcode.com/graphql",
        "query userPublicProfile($username: String!) { matchedUser(username: $username) { username profile { realName aboutMe userAvatar } } }",
        Map.of("username", username))
        .path("data")
        .path("matchedUser");
    return data.toString();
  }

  private String fetchGithubVerificationText(String encoded) throws Exception {
    return getJson("https://api.github.com/users/" + encoded).toString();
  }

  private String fetchCodeforcesVerificationText(String encoded) throws Exception {
    return getJson("https://codeforces.com/api/user.info?handles=" + encoded).toString()
        + "\n"
        + publicHtmlText("https://codeforces.com/profile/" + encoded);
  }

  private String jsonAndHtmlText(String jsonUrl, String htmlUrl) throws Exception {
    StringBuilder text = new StringBuilder();
    try {
      text.append(getJson(jsonUrl).toString());
    } catch (Exception ignored) {
      // HTML fallback below still gives strict public proof when available.
    }
    text.append("\n").append(publicHtmlText(htmlUrl));
    return text.toString();
  }

  private String publicHtmlText(String url) {
    return stripHtml(getText(url));
  }

  private JsonNode postGraphQl(String url, String query, Map<String, Object> variables) throws Exception {
    HttpHeaders headers = defaultHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    String body = objectMapper.writeValueAsString(Map.of("query", query, "variables", variables));
    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    return objectMapper.readTree(response.getBody());
  }

  private JsonNode getJson(String url) throws Exception {
    String body = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(defaultHeaders()), String.class).getBody();
    return objectMapper.readTree(body == null ? "{}" : body);
  }

  private String getText(String url) {
    return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(defaultHeaders()), String.class).getBody();
  }

  private HttpHeaders defaultHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("User-Agent", USER_AGENT);
    headers.set("Accept", "application/json,text/html;q=0.9,*/*;q=0.8");
    return headers;
  }

  private String stripHtml(String html) {
    if (html == null) return "";
    return html
        .replaceAll("(?is)<script.*?</script>", " ")
        .replaceAll("(?is)<style.*?</style>", " ")
        .replaceAll("(?s)<[^>]+>", " ")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replaceAll("\\s+", " ")
        .trim();
  }

  private List<Map<String, Object>> calendarActivity(String submissionCalendar) throws Exception {
    if (submissionCalendar == null || submissionCalendar.isBlank()) return List.of();
    JsonNode calendar = objectMapper.readTree(submissionCalendar);
    List<Map<String, Object>> activity = new ArrayList<>();
    calendar.fields().forEachRemaining(entry -> {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("label", epochDay(Long.parseLong(entry.getKey())));
      item.put("count", entry.getValue().asInt(0));
      activity.add(item);
    });
    return activity;
  }

  private List<Map<String, Object>> activityList(Map<String, Integer> countsByDate) {
    return countsByDate.entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .map(entry -> {
          Map<String, Object> item = new LinkedHashMap<>();
          item.put("label", entry.getKey());
          item.put("count", entry.getValue());
          return item;
        })
        .toList();
  }

  private List<Map<String, Object>> topicList(Map<String, Integer> countsByTopic) {
    return countsByTopic.entrySet().stream()
        .filter(entry -> entry.getValue() != null && entry.getValue() > 0)
        .sorted((left, right) -> Integer.compare(right.getValue(), left.getValue()))
        .limit(8)
        .map(entry -> {
          Map<String, Object> item = new LinkedHashMap<>();
          item.put("label", entry.getKey());
          item.put("count", entry.getValue());
          return item;
        })
        .toList();
  }

  private List<Map<String, Object>> ratingHistoryFromCodeforces(JsonNode rows) {
    List<Map<String, Object>> history = new ArrayList<>();
    for (JsonNode row : rows) {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("label", row.path("contestName").asText("Contest"));
      item.put("rating", row.path("newRating").asInt(0));
      history.add(item);
    }
    return history.size() <= 12 ? history : history.subList(history.size() - 12, history.size());
  }

  private List<Map<String, Object>> ratingHistoryFromLeetCode(JsonNode rows) {
    List<Map<String, Object>> history = new ArrayList<>();
    for (JsonNode row : rows) {
      if (!row.path("attended").asBoolean(false)) continue;
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("label", row.path("contest").path("title").asText("Contest"));
      item.put("rating", Math.round(row.path("rating").asDouble(0)));
      history.add(item);
    }
    return history.size() <= 12 ? history : history.subList(history.size() - 12, history.size());
  }

  private Map<String, Integer> difficultyFromNode(JsonNode node) {
    Map<String, Integer> difficulty = difficultyMap();
    difficulty.put("easy", firstInt(node, "easy", "Easy"));
    difficulty.put("medium", firstInt(node, "medium", "Medium"));
    difficulty.put("hard", firstInt(node, "hard", "Hard"));
    return difficulty;
  }

  private Map<String, Integer> difficultyMap() {
    Map<String, Integer> difficulty = new LinkedHashMap<>();
    difficulty.put("easy", 0);
    difficulty.put("medium", 0);
    difficulty.put("hard", 0);
    difficulty.put("unknown", 0);
    return difficulty;
  }

  private int firstInt(JsonNode node, String... keys) {
    for (String key : keys) {
      JsonNode value = node.path(key);
      if (value.isNumber()) return value.asInt();
      if (value.path("count").isNumber()) return value.path("count").asInt();
    }
    return 0;
  }

  private Integer nullableInt(JsonNode node, String key) {
    JsonNode value = node.path(key);
    return value.isNumber() ? value.asInt() : null;
  }

  private String epochDay(long epochSeconds) {
    if (epochSeconds <= 0) return "";
    return LocalDate.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneOffset.UTC).toString();
  }

  private String normalizePlatform(String platform) {
    String normalized = platform == null ? "" : platform.trim().toLowerCase();
    if (normalized.isBlank()) throw new IllegalArgumentException("Platform is required.");
    return normalized;
  }

  private String normalizeUsername(String username) {
    String trimmed = username == null ? "" : username.trim();
    if (trimmed.isBlank()) throw new IllegalArgumentException("Username is required.");
    if (trimmed.length() > 80) throw new IllegalArgumentException("Username is too long.");
    return trimmed;
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private String decodeForPayload(String encoded) {
    return URLDecoder.decode(encoded, StandardCharsets.UTF_8);
  }

  public record PlatformDefinition(
      String key,
      String label,
      String shortLabel,
      String profilePrefix,
      String profileUrlTemplate,
      String verificationTarget,
      String verificationInstructions,
      boolean strictVerificationPossible,
      String reliabilityTier,
      String statsSource
  ) {
    public String profileUrl(String username) {
      return profileUrlTemplate.replace("{username}", username == null ? "" : username.trim());
    }
  }

  public record VerificationProbe(boolean supported, String text, String message) {}
}
