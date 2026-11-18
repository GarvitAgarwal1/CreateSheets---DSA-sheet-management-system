package com.iqms.backend.config;

import com.iqms.backend.config.properties.SwrCacheProperties;
import java.util.concurrent.Executor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(SwrCacheProperties.class)
public class SwrCacheConfig {

  @Bean
  public Executor swrExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(8);
    executor.setQueueCapacity(500);
    executor.setThreadNamePrefix("swr-refresh-");
    executor.initialize();
    return executor;
  }

  @Bean
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }
}
